from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.models import Notification, User
from app.deps import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("/", response_model=List[Notification])
def get_my_notifications(
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    return crud.get_notifications(session, current_user.id, limit=limit)

@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Security: Check if notif belongs to user? crud.mark_notification_read implies fetching by ID.
    # crud implementation: session.get(Notification, notification_id).
    # We should verify ownership.
    
    notif = session.get(Notification, notif_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notif.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    notif.is_read = True
    session.add(notif)
    session.commit()
    return {"status": "success"}
