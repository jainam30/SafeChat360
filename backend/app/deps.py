from fastapi import Depends, HTTPException, Header
from typing import Optional
from sqlmodel import Session
from app.db import get_session
from app.auth_utils import decode_access_token
from app.crud import get_user

def get_token_auth_header(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    parts = authorization.split()
    if parts[0].lower() != "bearer" or len(parts) != 2:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return parts[1]

def get_current_user(token: str = Depends(get_token_auth_header), session: Session = Depends(get_session)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = get_user(session, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(role: str):
    def _require_role(user = Depends(get_current_user)):
        if user.role != role and user.role != "admin":
            raise HTTPException(status_code=403, detail="Insufficient privileges")
        return user
    return _require_role
