"""
Plaid Link Token endpoint for FastAPI backend
Equivalent to the Netlify function for local/Emergent testing
Uses PlaidService which supports both MOCK and SANDBOX modes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.plaid_service import get_plaid_service

router = APIRouter()

class LinkTokenRequest(BaseModel):
    client_user_id: str = "pbx-demo-user"

@router.post("/api/plaid/link-token")
async def create_link_token(request: LinkTokenRequest):
    """
    Generate a Plaid Link token for sandbox testing
    Works in both MOCK and SANDBOX modes based on PLAID_MODE env var
    """
    try:
        plaid_service = get_plaid_service()
        result = await plaid_service.create_link_token(request.client_user_id)
        return {"link_token": result.get("link_token")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
