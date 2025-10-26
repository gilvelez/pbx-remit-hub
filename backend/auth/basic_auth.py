from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import os
import secrets

security = HTTPBasic()

def verify_admin_auth(credentials: HTTPBasicCredentials = Depends(security)):
    """
    Verify admin credentials using Basic Auth.
    Username must be 'admin' and password must match ADMIN_PASSWORD env var.
    """
    admin_password = os.environ.get('ADMIN_PASSWORD', '')
    
    # Use constant-time comparison to prevent timing attacks
    is_username_correct = secrets.compare_digest(credentials.username.encode('utf-8'), b"admin")
    is_password_correct = secrets.compare_digest(credentials.password.encode('utf-8'), admin_password.encode('utf-8'))
    
    if not (is_username_correct and is_password_correct):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return credentials.username
