"""
Plaid Link Token endpoint for FastAPI backend
Equivalent to the Netlify function for local/Emergent testing
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

class LinkTokenRequest(BaseModel):
    client_user_id: str = "pbx-demo-user"

@router.post("/api/plaid/link-token")
async def create_link_token(request: LinkTokenRequest):
    """
    Generate a Plaid Link token for sandbox testing
    """
    try:
        plaid_client_id = os.getenv("PLAID_CLIENT_ID")
        plaid_secret = os.getenv("PLAID_SECRET")
        app_base_url = os.getenv("APP_BASE_URL", "http://localhost:3000")
        
        if not plaid_client_id or not plaid_secret:
            raise HTTPException(
                status_code=500,
                detail="PLAID_CLIENT_ID and PLAID_SECRET must be set in environment variables"
            )
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://sandbox.plaid.com/link/token/create",
                json={
                    "client_id": plaid_client_id,
                    "secret": plaid_secret,
                    "user": {"client_user_id": request.client_user_id},
                    "client_name": "Philippine Bayani Exchange",
                    "products": ["auth"],
                    "language": "en",
                    "country_codes": ["US"],
                    "redirect_uri": f"{app_base_url}/plaid/callback"
                },
                headers={"Content-Type": "application/json"}
            )
            
            data = response.json()
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Plaid error: {data}"
                )
            
            return {"link_token": data.get("link_token")}
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"HTTP error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
