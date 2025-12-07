from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import ModerationLog, User
from app.deps import get_current_user

router = APIRouter(prefix="/api/review", tags=["review"])

@router.get("/queue", response_model=List[ModerationLog])
def get_review_queue(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Only allow admins or moderators (add role check if needed, strictly assuming "moderator" or "admin" role exists, 
    # but for MVP allowing any auth user or checking role='admin')
    # if current_user.role != "admin": raise ...
    
    # Fetch logs that are flagged and status is pending
    statement = select(ModerationLog).where(
        ModerationLog.is_flagged == True,
        ModerationLog.review_status == "pending"
    ).order_by(ModerationLog.created_at.desc())
    
    logs = session.exec(statement).all()
    return logs

@router.post("/{log_id}/resolve")
def resolve_log(
    log_id: int,
    action: str = Body(..., embed=True), # "dismiss" or "confirm"
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    log = session.get(ModerationLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    if action == "dismiss":
        log.review_status = "dismissed"
        log.is_flagged = False # It was a false positive
    elif action == "confirm":
        log.review_status = "confirmed"
        # Log remains flagged. Could apply extra penalty here.
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    session.add(log)
    session.commit()
    session.refresh(log)
    return {"status": "success", "data": log}
