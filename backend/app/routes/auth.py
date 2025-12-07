from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.auth_utils import get_password_hash, verify_password, create_access_token
import traceback
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    phone_number: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=dict)
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    try:
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
def login(req: LoginRequest, session: Session = Depends(get_session)):
    try:
        user = crud.get_user_by_email(session, req.email)
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
        return {"access_token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
