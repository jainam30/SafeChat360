from fastapi import APIRouter, Depends
from typing import List, Dict
from app.deps import get_current_user, get_notif_service
from app.models import User
from app.services.notification import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("/", response_model=List[dict])
def get_notifications(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notif_service)
):
    return service.get_notifications(current_user, limit)

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notif_service)
):
    return service.mark_read(notification_id, current_user)

@router.post("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notif_service)
):
    return service.mark_all_read(current_user)
