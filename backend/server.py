from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path
from typing import List
import re
from datetime import datetime

# Import database connection
from database.connection import connect_to_mongo, close_mongo_connection

# Import models
from models.lead import LeadCreate, LeadResponse
from models.session_state import (
    SessionStateCreate, 
    SessionStateUpdate, 
    SessionStateResponse,
    ActivityItem
)

# Import services
from services.lead_service import LeadService
from services.session_service import SessionService
from services.plaid_service import get_plaid_service

# Import auth
from auth.basic_auth import verify_admin_auth

# Import routes
from routes.plaid import router as plaid_router
from routes.recipient import router as recipient_router
from routes.users import router as users_router
from routes.internal_transfers import router as internal_router
from routes.auth import router as auth_router
from routes.notification_prefs import router as notification_router
from routes.social import router as social_router
from routes.profiles import router as profiles_router
from routes.businesses import router as businesses_router

# Import utilities
from utils.user_helper import get_user_id, get_user_id_from_request
from utils.plaid_mock import (
    generate_link_token,
    generate_access_token,
    generate_item_id,
    generate_mock_accounts,
    generate_mock_transactions
)
from utils.circle_mock import (
    generate_transaction_id,
    calculate_php_transfer,
    format_destination_tag
)
from utils.security import (
    limiter,
    get_client_ip,
    validate_email_format,
    log_rate_limit_hit
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="PBX API", version="1.0.0")

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize services
lead_service = LeadService()
session_service = SessionService()
plaid_service = get_plaid_service()


# ============== Health Check Routes ==============

@api_router.get("/")
async def root():
    return {
        "message": "PBX API - Philippine Bayani Exchange",
        "status": "running",
        "version": "1.0.0"
    }

@api_router.get("/health")
async def health_check():
    """
    Health endpoint for Phase 3: Health + Safety
    Reports service status, DB connectivity, and feature flags.
    
    NO SECRETS logged or exposed.
    """
    from database.connection import get_database
    
    health_status = {
        "status": "healthy",
        "service": "pbx-api",
        "version": "1.0.0",
        "components": {}
    }
    
    # Check MongoDB connectivity
    try:
        db = get_database()
        await db.command("ping")
        health_status["components"]["mongodb"] = {
            "status": "connected",
            "db_name": os.environ.get("DB_NAME", "pbx_database")
        }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["components"]["mongodb"] = {
            "status": "disconnected",
            "error": "Database connection failed"  # No detailed error for security
        }
    
    # Feature flags (loaded from env, no secrets)
    health_status["features"] = {
        "email_notifications": bool(os.environ.get("RESEND_API_KEY")),
        "sms_notifications": bool(os.environ.get("TWILIO_ACCOUNT_SID")),
        "live_fx_rates": bool(os.environ.get("OPENEXCHANGERATES_API_KEY")),
        "plaid_mode": os.environ.get("PLAID_MODE", "MOCK"),
        "ledger_transactions": True,  # Phase 1: Ledger hardening
        "admin_audit_logs": True,     # Phase 2: Admin + Audit
    }
    
    # Timestamps
    health_status["timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    return health_status


# ============== Lead Management Routes ==============

@api_router.post("/leads")
@limiter.limit("5/minute")  # Rate limit: 5 requests per minute per IP
async def create_lead(request: Request, lead_data: LeadCreate):
    """
    Create a new lead (email submission).
    Rate limited to 5 requests per minute per IP.
    Returns 200 with status even if email already exists.
    """
    client_ip = get_client_ip(request)
    
    # Validate email format (additional check beyond Pydantic)
    if not validate_email_format(lead_data.email):
        logger.warning(f"Invalid email format from IP {client_ip}: {lead_data.email}")
        return {
            "status": "invalid_email",
            "message": "Please provide a valid email address"
        }
    
    try:
        # Try to create the lead
        lead = await lead_service.create_lead(lead_data)
        logger.info(f"Lead created from IP {client_ip}: {lead.email}")
        return {
            "status": "ok",
            "lead": {
                "id": lead.id,
                "email": lead.email,
                "created_at": lead.created_at.isoformat()
            }
        }
    except ValueError as e:
        # Email already exists
        if "already registered" in str(e):
            logger.info(f"Duplicate email attempt from IP {client_ip}: {lead_data.email}")
            return {
                "status": "already_subscribed",
                "message": "This email is already subscribed"
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValidationError as e:
        logger.warning(f"Validation error from IP {client_ip}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input data"
        )
    except Exception as e:
        logger.error(f"Error creating lead from IP {client_ip}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create lead"
        )

@api_router.get("/leads")
async def get_all_leads(admin: str = Depends(verify_admin_auth)):
    """
    Get last 500 leads, newest first.
    Requires Basic Auth: admin:<ADMIN_PASSWORD>
    """
    try:
        leads = await lead_service.get_all_leads(skip=0, limit=500)
        return leads
    except Exception as e:
        logger.error(f"Error fetching leads: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch leads"
        )

# ============== State Management Routes ==============

@api_router.get("/state", response_model=SessionStateResponse)
async def get_state(request: Request, response: Response):
    """
    Get session state for current user.
    Creates new session if it doesn't exist.
    Sets pbx_uid cookie if user doesn't have one.
    """
    try:
        # Get or create user ID (sets cookie if needed)
        user_id = get_user_id(request, response)
        
        # Get or create session
        session = await session_service.get_or_create_session(user_id)
        
        return session
    except Exception as e:
        logger.error(f"Error fetching state: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch state"
        )

@api_router.post("/state/clear")
async def clear_state(request: Request, response: Response):
    """
    Clear demo state for current user.
    Deletes the session and creates a fresh one.
    """
    try:
        # Get user ID from request
        user_id = get_user_id(request, response)
        
        # Delete existing session
        await session_service.delete_session(user_id)
        
        # Create fresh session
        session = await session_service.get_or_create_session(user_id)
        
        return {
            "status": "ok",
            "message": "Demo state cleared successfully",
            "session": session
        }
    except Exception as e:
        logger.error(f"Error clearing state: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear state"
        )


# ============== Plaid Mock API Routes ==============

@api_router.post("/plaid/mock/create-link-token")
async def create_link_token(request: Request, response: Response):
    """
    Create a Plaid Link token.
    Works with both MOCK and SANDBOX modes based on PLAID_MODE env var.
    """
    try:
        user_id = get_user_id(request, response)
        token_data = await plaid_service.create_link_token(user_id)
        logger.info(f"Generated Plaid link token for user {user_id} in {plaid_service.mode} mode")
        return token_data
    except Exception as e:
        logger.error(f"Error generating link token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate link token: {str(e)}"
        )

@api_router.post("/plaid/mock/exchange")
async def exchange_public_token(request: Request, response: Response):
    """
    Exchange a public token for an access token.
    Works with both MOCK and SANDBOX modes based on PLAID_MODE env var.
    """
    try:
        # Get user ID
        user_id = get_user_id(request, response)
        
        # Get public token from request body
        body = await request.json()
        public_token = body.get('public_token', 'public-sandbox-mock')
        
        # Exchange token
        token_data = await plaid_service.exchange_public_token(public_token)
        
        # Update session with access token
        update_data = SessionStateUpdate(access_token=token_data["access_token"])
        await session_service.update_session(user_id, update_data)
        
        logger.info(f"Exchanged public token for user: {user_id} in {plaid_service.mode} mode")
        
        return token_data
    except Exception as e:
        logger.error(f"Error exchanging token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to exchange token: {str(e)}"
        )

@api_router.get("/plaid/mock/accounts")
async def get_accounts(request: Request, response: Response):
    """
    Get bank accounts.
    Seeds sample accounts in MOCK mode, fetches real accounts in SANDBOX mode.
    """
    try:
        # Get user ID
        user_id = get_user_id(request, response)
        
        # Get or create session
        session = await session_service.get_or_create_session(user_id)
        
        # Check if accounts already exist
        if not session.accounts or len(session.accounts) == 0:
            # Get accounts based on mode
            if plaid_service.mode == 'MOCK':
                accounts_data = await plaid_service.get_accounts(None)
            else:
                # For SANDBOX, we need the access token
                if not session.access_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No access token found. Please connect your bank first."
                    )
                accounts_data = await plaid_service.get_accounts(session.access_token)
            
            # Save to session
            update_data = SessionStateUpdate(accounts=accounts_data["accounts"])
            session = await session_service.update_session(user_id, update_data)
            logger.info(f"Fetched {len(accounts_data['accounts'])} accounts for user: {user_id} in {plaid_service.mode} mode")
        
        return {
            "accounts": session.accounts
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch accounts: {str(e)}"
        )

@api_router.get("/plaid/mock/transactions")
async def get_transactions(request: Request, response: Response, limit: int = 10):
    """
    Get transactions.
    Seeds sample transactions in MOCK mode, fetches real transactions in SANDBOX mode.
    """
    try:
        # Get user ID
        user_id = get_user_id(request, response)
        
        # Get or create session
        session = await session_service.get_or_create_session(user_id)
        
        # Check if transactions already exist
        if not session.transactions or len(session.transactions) == 0:
            # Get transactions based on mode
            if plaid_service.mode == 'MOCK':
                transactions_data = await plaid_service.get_transactions(None, limit)
            else:
                # For SANDBOX, we need the access token
                if not session.access_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No access token found. Please connect your bank first."
                    )
                transactions_data = await plaid_service.get_transactions(session.access_token, limit)
            
            # Save to session
            update_data = SessionStateUpdate(transactions=transactions_data["transactions"])
            session = await session_service.update_session(user_id, update_data)
            logger.info(f"Fetched {len(transactions_data['transactions'])} transactions for user: {user_id} in {plaid_service.mode} mode")
        
        # Return limited transactions
        transactions = session.transactions[:limit] if session.transactions else []
        
        return {
            "transactions": transactions
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}"
        )


# ============== Circle Mock API Routes ==============

class SendFundsRequest(BaseModel):
    amount_usd: float = Field(..., alias="amountUSD", gt=0)
    destination_type: str = Field(..., alias="destinationType")
    destination_tag: str = Field(..., alias="destinationTag")
    
    class Config:
        populate_by_name = True

@api_router.post("/circle/sendFunds")
async def send_funds(request: Request, response: Response, send_request: SendFundsRequest):
    """
    Send funds via Circle (mock).
    Simulates USD to PHP transfer with quoted rate and fees.
    """
    try:
        client_ip = get_client_ip(request)
        
        # Validate destination type
        if send_request.destination_type not in ["GCash", "PH_BANK"]:
            logger.warning(f"Invalid destination type from IP {client_ip}: {send_request.destination_type}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="destinationType must be 'GCash' or 'PH_BANK'"
            )
        
        # Validate amount
        if send_request.amount_usd <= 0:
            logger.warning(f"Invalid amount from IP {client_ip}: {send_request.amount_usd}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be greater than 0"
            )
        
        # Validate destination tag
        if not send_request.destination_tag or len(send_request.destination_tag.strip()) == 0:
            logger.warning(f"Empty destination tag from IP {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Destination tag cannot be empty"
            )
        
        # Get user ID
        user_id = get_user_id(request, response)
        
        # Calculate transfer details
        transfer_calc = calculate_php_transfer(
            amount_usd=send_request.amount_usd,
            quoted_rate=56.10,
            fee_usd=1.00
        )
        
        # Generate transaction ID
        transaction_id = generate_transaction_id("txn", 10)
        
        # Create activity item
        activity_item = ActivityItem(
            id=transaction_id,
            type="SEND",
            amount_usd=transfer_calc["amount_usd"],
            est_php=transfer_calc["est_php"],
            fees_usd=transfer_calc["fee_usd"],
            status="pending",
            created_at=datetime.utcnow()
        )
        
        # Add to session activity
        session = await session_service.add_activity(user_id, activity_item)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        logger.info(f"Transfer created from IP {client_ip}: {transaction_id} - ${send_request.amount_usd} → ₱{transfer_calc['est_php']}")
        
        # Return transaction details
        return {
            "transactionId": transaction_id,
            "status": "pending",
            "quotedRate": transfer_calc["quoted_rate"],
            "feesUSD": transfer_calc["fee_usd"],
            "estPhp": transfer_calc["est_php"],
            "createdAt": activity_item.created_at.isoformat() + "Z",
            "destination": format_destination_tag(send_request.destination_type, send_request.destination_tag)
        }
        
    except HTTPException:
        raise
    except ValidationError as e:
        logger.warning(f"Validation error in sendFunds: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input data"
        )
    except Exception as e:
        logger.error(f"Error sending funds: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send funds"
        )


# ============== Session Management Routes ==============

@api_router.post("/sessions", response_model=SessionStateResponse, status_code=status.HTTP_201_CREATED)
async def create_session(session_data: SessionStateCreate):
    """Create a new session state."""
    try:
        session = await session_service.create_session(session_data)
        return session
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session"
        )

@api_router.get("/sessions/{user_id}", response_model=SessionStateResponse)
async def get_session(user_id: str):
    """Get or create session by user ID."""
    try:
        session = await session_service.get_or_create_session(user_id)
        return session
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch session"
        )

@api_router.put("/sessions/{user_id}", response_model=SessionStateResponse)
async def update_session(user_id: str, update_data: SessionStateUpdate):
    """Update session state."""
    try:
        session = await session_service.update_session(user_id, update_data)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session"
        )

@api_router.post("/sessions/{user_id}/activity", response_model=SessionStateResponse)
async def add_activity(user_id: str, activity: ActivityItem):
    """Add activity to session."""
    try:
        session = await session_service.add_activity(user_id, activity)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add activity"
        )

@api_router.delete("/sessions/{user_id}")
async def delete_session(user_id: str):
    """Delete session by user ID."""
    try:
        deleted = await session_service.delete_session(user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        return {"message": "Session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )


# Include routers
app.include_router(api_router)
app.include_router(plaid_router)
app.include_router(recipient_router)
app.include_router(users_router)
app.include_router(internal_router)
app.include_router(auth_router)
app.include_router(notification_router)
app.include_router(social_router)
app.include_router(profiles_router)
app.include_router(businesses_router)

# CORS middleware - only allow specific origins when using credentials
cors_origins_env = os.environ.get('CORS_ORIGINS', '*')

if cors_origins_env == '*':
    # For development with credentials, we need to be more specific
    # Allow localhost and common development ports
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    logger.warning("CORS_ORIGINS set to wildcard - using localhost only for development")
else:
    # Production: use explicit origins from env
    cors_origins = [origin.strip() for origin in cors_origins_env.split(',')]
    logger.info(f"CORS configured for origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


# ============== Startup & Shutdown Events ==============

@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup."""
    try:
        await connect_to_mongo()
        logger.info("PBX API started successfully")
    except Exception as e:
        logger.error(f"Failed to start PBX API: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown."""
    await close_mongo_connection()
    logger.info("PBX API shut down successfully")