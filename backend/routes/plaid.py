"""
Plaid Link Token endpoint for FastAPI backend
Equivalent to the Netlify function for local/Emergent testing
Uses PlaidService which supports both MOCK and SANDBOX modes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.plaid_service import get_plaid_service, log_plaid_config
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class LinkTokenRequest(BaseModel):
    client_user_id: str = "pbx-demo-user"

@router.get("/api/plaid/config")
async def get_plaid_config():
    """
    Debug endpoint to check Plaid configuration (no secrets exposed).
    Returns: mode, has_client_id, has_secret, env
    """
    config = log_plaid_config()
    return {
        "plaid_mode": config["mode"],
        "has_client_id": config["has_client_id"],
        "has_secret": config["has_secret"],
        "plaid_env": config["env"],
        "status": "ready" if (config["mode"] == "MOCK" or (config["has_client_id"] and config["has_secret"])) else "missing_credentials"
    }

@router.post("/api/plaid/link-token")
async def create_link_token(request: LinkTokenRequest):
    """
    Generate a Plaid Link token for sandbox testing
    Works in both MOCK and SANDBOX modes based on PLAID_MODE env var
    """
    try:
        # Log config for debugging (safe - no secrets exposed)
        config = log_plaid_config()
        logger.info(f"[PLAID ROUTE] Creating link token for user: {request.client_user_id}")
        
        plaid_service = get_plaid_service()
        result = await plaid_service.create_link_token(request.client_user_id)
        
        link_token = result.get("link_token")
        if not link_token:
            logger.error("[PLAID ROUTE] No link_token in response")
            raise HTTPException(
                status_code=500, 
                detail={
                    "error": "NO_LINK_TOKEN",
                    "message": "Plaid returned empty link token",
                    "plaid_config": config
                }
            )
        
        logger.info("[PLAID ROUTE] Successfully created link token")
        return {"link_token": link_token, "expiration": result.get("expiration")}
        
    except HTTPException:
        raise
    except ValueError as e:
        # Missing credentials
        logger.error(f"[PLAID ROUTE] Configuration error: {e}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "CONFIG_ERROR",
                "message": str(e),
                "plaid_config": log_plaid_config()
            }
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[PLAID ROUTE] Error creating link token: {error_msg}")
        
        # Return detailed error for debugging
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "PLAID_ERROR",
                "message": error_msg,
                "plaid_config": log_plaid_config()
            }
        )
