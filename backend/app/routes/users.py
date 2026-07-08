from fastapi import APIRouter, Depends
from app.deps import get_current_user, get_user_service
from app.models import User
from app.schemas.user import UpdateProfileRequest, UpdateEmailRequest, UpdatePasswordRequest
from app.services.user import UserService

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=dict)
def get_me(
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    return service.get_me(current_user)

@router.put("/me", response_model=dict)
def update_profile(
    req: UpdateProfileRequest, 
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    return service.update_profile(req, current_user)

@router.put("/me/email", response_model=dict)
def update_email(
    req: UpdateEmailRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    return service.update_email(req, current_user)

@router.put("/me/password", response_model=dict)
def update_password(
    req: UpdatePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    return service.update_password(req, current_user)

@router.get("/{user_id}", response_model=dict)
def get_user_public_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    return service.get_user_public_profile(user_id, current_user)
