from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.auth_utils import get_password_hash, verify_password, create_access_token
import traceback
import logging
from firebase_admin import auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    phone_number: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"
    firebase_token: str # NEW: Required for email verification

class LoginRequest(BaseModel):
    identifier: str
    password: str
    device_id: str = "unknown_device" # NEW: To track devices

class VerifyRequest(BaseModel):
    firebase_token: str
    device_id: str = "unknown_device"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

from starlette.requests import Request
from app.limiter import limiter

@router.post("/register", response_model=dict)
@limiter.limit("5/minute")
def register(request: Request, req: RegisterRequest, session: Session = Depends(get_session)):
    try:
        # 1. Verify Firebase Token
        try:
            decoded_token = auth.verify_id_token(req.firebase_token)
            firebase_email = decoded_token.get('email')
            if not firebase_email or firebase_email != req.email:
                raise HTTPException(status_code=400, detail="Firebase email verification failed or mismatch")
        except Exception as e:
             raise HTTPException(status_code=400, detail=f"Invalid Firebase Token: {str(e)}")

        if crud.get_user_by_email(session, req.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if crud.get_user_by_username(session, req.username):
            raise HTTPException(status_code=400, detail="Username already taken")
        if crud.get_user_by_phone(session, req.phone_number):
            raise HTTPException(status_code=400, detail="Phone number already registered")

        print(f"DEBUG REGISTER: Email={req.email}, Password Length={len(req.password)}")
        if len(req.password) > 72:
             print(f"DEBUG WARNING: Password too long! ({len(req.password)} chars)")

        hashed = get_password_hash(req.password)
        user = crud.create_user(
            session, 
            email=req.email, 
            username=req.username,
            phone_number=req.phone_number,
            hashed_password=hashed, 
            full_name=req.full_name, 
            role=req.role or "user"
        )
        return {"status": "success", "data": {"id": user.id, "email": user.email, "role": user.role}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Register error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, session: Session = Depends(get_session)):
    try:
        # Try to find by email first
        user = crud.get_user_by_email(session, req.identifier)
        if not user:
            # If not found by email, try username
            user = crud.get_user_by_username(session, req.identifier)
            
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # 2. Check Active Sessions
        active_count = crud.get_active_sessions_count(session, user.id)
        if active_count >= 2:
            # More than 2 devices? Challenge required.
            raise HTTPException(status_code=403, detail="DEVICE_LIMIT_EXCEEDED")

        # 3. Create Session
        crud.create_user_session(session, user.id, req.device_id)

        token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
        return {"access_token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"Login failed: {str(e)}"}
        )

@router.post("/verify-identity", response_model=TokenResponse)
@limiter.limit("5/minute")
def verify_identity(request: Request, req: VerifyRequest, session: Session = Depends(get_session)):
    try:
        # User is challenged (e.g. device limit), so they provide firebase token (via re-auth)
        decoded_token = auth.verify_id_token(req.firebase_token)
        email = decoded_token.get('email')
        
        user = crud.get_user_by_email(session, email)
        if not user:
             raise HTTPException(status_code=404, detail="User not found")

        # If verified successfully, we can reset sessions or just allow this one.
        # Strategy: Deactivate old sessions to allow this new one
        crud.deactivate_sessions(session, user.id)
        
        # Create new single session
        crud.create_user_session(session, user.id, req.device_id)

        token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
        return {"access_token": token}
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Identity verification failed")
