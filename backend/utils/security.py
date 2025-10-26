"""
Security utilities for rate limiting and input validation.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException, status
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

# Initialize rate limiter
# Uses in-memory storage by default (simple and works for single instance)
# For production with multiple instances, use Redis backend
limiter = Limiter(key_func=get_remote_address)


def get_client_ip(request: Request) -> str:
    """
    Get client IP address, checking for proxy headers.
    
    Priority:
    1. X-Forwarded-For (from load balancer/proxy)
    2. X-Real-IP (from nginx)
    3. Direct connection IP
    """
    # Check X-Forwarded-For header (from load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header (from nginx)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fall back to direct connection IP
    if request.client:
        return request.client.host
    
    return "unknown"


def validate_json_body(body: Dict[str, Any], required_fields: list) -> None:
    """
    Validate JSON request body has required fields.
    
    Args:
        body: Request body dictionary
        required_fields: List of required field names
    
    Raises:
        HTTPException: 400 if validation fails
    """
    missing_fields = [field for field in required_fields if field not in body]
    
    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required fields: {', '.join(missing_fields)}"
        )


def validate_email_format(email: str) -> bool:
    """
    Basic email format validation.
    More strict than Pydantic's EmailStr to catch obvious issues.
    
    Args:
        email: Email address to validate
    
    Returns:
        True if valid format, False otherwise
    """
    import re
    
    if not email or not isinstance(email, str):
        return False
    
    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        return False
    
    # Additional checks
    if '..' in email:  # No consecutive dots
        return False
    
    if email.startswith('.') or email.endswith('.'):  # No leading/trailing dots
        return False
    
    local, domain = email.rsplit('@', 1)
    
    if len(local) > 64:  # Local part max length
        return False
    
    if len(domain) > 253:  # Domain max length
        return False
    
    return True


def log_rate_limit_hit(request: Request, limit: str):
    """
    Log rate limit violations for monitoring.
    
    Args:
        request: FastAPI request object
        limit: Rate limit that was exceeded
    """
    client_ip = get_client_ip(request)
    path = request.url.path
    
    logger.warning(
        f"Rate limit exceeded: IP={client_ip}, Path={path}, Limit={limit}"
    )
