from fastapi import APIRouter, Depends
from typing import List
from app.deps import get_current_user, get_group_service
from app.models import User
from app.schemas.group import GroupCreate, GroupResponse
from app.services.group import GroupService

router = APIRouter(prefix="/api/groups", tags=["groups"])

@router.post("/", response_model=GroupResponse)
def create_group(
    group_in: GroupCreate,
    current_user: User = Depends(get_current_user),
    service: GroupService = Depends(get_group_service)
):
    return service.create_group(group_in, current_user)

@router.get("/", response_model=List[GroupResponse])
def get_my_groups(
    current_user: User = Depends(get_current_user),
    service: GroupService = Depends(get_group_service)
):
    return service.get_my_groups(current_user)

@router.get("/{group_id}/members", response_model=List[dict])
def get_group_members(
    group_id: int,
    current_user: User = Depends(get_current_user),
    service: GroupService = Depends(get_group_service)
):
    return service.get_group_members(group_id, current_user)
