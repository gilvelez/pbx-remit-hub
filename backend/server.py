from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from typing import List
import re

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

# Import auth
from auth.basic_auth import verify_admin_auth

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

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize services
lead_service = LeadService()
session_service = SessionService()


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
    return {"status": "healthy"}


# ============== Lead Management Routes ==============

def validate_email(email: str) -> bool:
    """Validate email with basic regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@api_router.post("/leads")
async def create_lead(lead_data: LeadCreate):
    """
    Create a new lead (email submission).
    Returns 200 with status even if email already exists.
    """
    # Validate email format
    if not validate_email(lead_data.email):
        return {
            "status": "invalid_email",
            "message": "Please provide a valid email address"
        }
    
    try:
        # Try to create the lead
        lead = await lead_service.create_lead(lead_data)
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
            return {
                "status": "already_subscribed",
                "message": "This email is already subscribed"
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating lead: {e}")
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
    Create a mock Plaid Link token.
    Returns a link token that expires in 1 hour.
    """
    try:
        token_data = generate_link_token()
        logger.info("Generated mock Plaid link token")
        return token_data
    except Exception as e:
        logger.error(f"Error generating link token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate link token"
        )

@api_router.post("/plaid/mock/exchange")
async def exchange_public_token(request: Request, response: Response):
    """
    Exchange a public token for an access token (mock).
    Saves the access token to the user's SessionState.
    """
    try:
        # Get user ID
        user_id = get_user_id(request, response)
        
        # Generate mock tokens
        access_token = generate_access_token()
        item_id = generate_item_id()
        
        # Update session with access token
        session = await session_service.get_or_create_session(user_id)
        update_data = SessionStateUpdate(access_token=access_token)
        await session_service.update_session(user_id, update_data)
        
        logger.info(f"Exchanged public token for user: {user_id}")
        
        return {
            "access_token": access_token,
            "item_id": item_id
        }
    except Exception as e:
        logger.error(f"Error exchanging token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to exchange token"
        )

@api_router.get("/plaid/mock/accounts")
async def get_accounts(request: Request, response: Response):
    """
    Get mock bank accounts.
    Seeds sample accounts if none exist, saves to SessionState.
    """
    try:
        # Get user ID
        user_id = get_user_id(request, response)
        
        # Get or create session
        session = await session_service.get_or_create_session(user_id)
        
        # Check if accounts already exist
        if not session.accounts or len(session.accounts) == 0:
            # Seed mock accounts
            mock_accounts = generate_mock_accounts()
            update_data = SessionStateUpdate(accounts=mock_accounts)
            session = await session_service.update_session(user_id, update_data)
            logger.info(f"Seeded {len(mock_accounts)} mock accounts for user: {user_id}")
        
        return {
            "accounts": session.accounts
        }
    except Exception as e:
        logger.error(f"Error fetching accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch accounts"
        )

@api_router.get("/plaid/mock/transactions")
async def get_transactions(request: Request, response: Response, limit: int = 10):
    """
    Get mock transactions.
    Seeds sample transactions if none exist, saves to SessionState.
    """
    try:
        # Get user ID
        user_id = get_user_id(request, response)
        
        # Get or create session
        session = await session_service.get_or_create_session(user_id)
        
        # Check if transactions already exist
        if not session.transactions or len(session.transactions) == 0:
            # Get account IDs for transactions
            account_ids = []
            if session.accounts:
                account_ids = [acc.get("account_id") for acc in session.accounts if acc.get("account_id")]
            
            # Seed mock transactions
            mock_transactions = generate_mock_transactions(account_ids, limit)
            update_data = SessionStateUpdate(transactions=mock_transactions)
            session = await session_service.update_session(user_id, update_data)
            logger.info(f"Seeded {len(mock_transactions)} mock transactions for user: {user_id}")
        
        # Return limited transactions
        transactions = session.transactions[:limit] if session.transactions else []
        
        return {
            "transactions": transactions
        }
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch transactions"
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
        # Validate destination type
        if send_request.destination_type not in ["GCash", "PH_BANK"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="destinationType must be 'GCash' or 'PH_BANK'"
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
        
        logger.info(f"Created transfer {transaction_id} for user {user_id}: ${send_request.amount_usd} → ₱{transfer_calc['est_php']}")
        
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


# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
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