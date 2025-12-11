from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.deps import get_current_user
from app.models import User
from app.auth_utils import verify_password, get_password_hash

router = APIRouter(prefix="/api/users", tags=["users"])

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    profile_photo: Optional[str] = None

class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    password: str

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone_number": current_user.phone_number,
        "profile_photo": current_user.profile_photo,
        "trust_score": current_user.trust_score,
        "role": current_user.role,
        "created_at": current_user.created_at
    }

@router.put("/me", response_model=dict)
def update_profile(
    req: UpdateProfileRequest, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    updates = {}
    if req.full_name is not None:
        updates["full_name"] = req.full_name
    if req.profile_photo is not None:
        updates["profile_photo"] = req.profile_photo
    if req.username is not None and req.username != current_user.username:
        if crud.get_user_by_username(session, req.username):
            raise HTTPException(status_code=400, detail="Username already taken")
        updates["username"] = req.username
    
    updated_user = crud.update_user(session, current_user, updates)
    return {
        "status": "success",
        "data": {
            "username": updated_user.username,
            "full_name": updated_user.full_name,
            "profile_photo": updated_user.profile_photo
        }
    }

@router.put("/me/email", response_model=dict)
def update_email(
    req: UpdateEmailRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if not verify_password(req.password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    if req.new_email == current_user.email:
        return {"status": "success", "message": "Email unchanged"}
        
    if crud.get_user_by_email(session, req.new_email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    updated_user = crud.update_user(session, current_user, {"email": req.new_email})
    return {"status": "success", "data": {"email": updated_user.email}}

@router.put("/me/password", response_model=dict)
def update_password(
    req: UpdatePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Re-fetch user in the current session to avoid detachment issues
    user_in_session = crud.get_user(session, current_user.id)
    if not user_in_session:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(req.old_password, user_in_session.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid old password")
    
    new_hashed = get_password_hash(req.new_password)
    crud.update_user(session, user_in_session, {"hashed_password": new_hashed})
    return {"status": "success", "message": "Password updated successfully"}

@router.get("/{user_id}", response_model=dict)
def get_user_public_profile(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    user = crud.get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "profile_photo": user.profile_photo,
        "trust_score": user.trust_score,
        "role": user.role,
        "created_at": user.created_at,
        "is_self": user.id == current_user.id
    }
