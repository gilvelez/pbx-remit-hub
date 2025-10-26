from fastapi import Request, Response
from typing import Optional
import uuid

COOKIE_NAME = "pbx_uid"
COOKIE_MAX_AGE = 365 * 24 * 60 * 60  # 1 year in seconds

def get_user_id(request: Request, response: Response) -> str:
    """
    Get user ID from:
    1. Logged-in user (if auth is implemented) - TODO
    2. Cookie "pbx_uid" (create if doesn't exist)
    
    Args:
        request: FastAPI request object
        response: FastAPI response object (to set cookie if needed)
    
    Returns:
        User ID string
    """
    # TODO: Check for authenticated user first when auth is implemented
    # if hasattr(request.state, 'user') and request.state.user:
    #     return request.state.user.id
    
    # Check for existing cookie
    user_id = request.cookies.get(COOKIE_NAME)
    
    if not user_id:
        # Generate new UUID for anonymous user
        user_id = str(uuid.uuid4())
        
        # Set cookie in response
        response.set_cookie(
            key=COOKIE_NAME,
            value=user_id,
            max_age=COOKIE_MAX_AGE,
            httponly=True,
            samesite="lax",
            secure=False  # Set to True in production with HTTPS
        )
    
    return user_id

def get_user_id_from_request(request: Request) -> Optional[str]:
    """
    Get user ID from request only (read-only, doesn't create cookie).
    
    Args:
        request: FastAPI request object
    
    Returns:
        User ID string or None if not found
    """
    # TODO: Check for authenticated user first
    # if hasattr(request.state, 'user') and request.state.user:
    #     return request.state.user.id
    
    # Check for existing cookie
    return request.cookies.get(COOKIE_NAME)
