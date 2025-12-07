from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import BlockedTerm, User
from app.deps import get_current_user

router = APIRouter(prefix="/api/blocklist", tags=["blocklist"])

@router.get("/", response_model=List[BlockedTerm])
def get_blocked_terms(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Depending on requirements, might restrict to admin only
    return session.exec(select(BlockedTerm).order_by(BlockedTerm.created_at.desc())).all()

@router.post("/", response_model=BlockedTerm)
def add_blocked_term(
    term: str = Body(..., embed=True),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check if exists
    existing = session.exec(select(BlockedTerm).where(BlockedTerm.term == term.lower())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Term already blocked")
        
    blocked = BlockedTerm(term=term.lower(), added_by=current_user.username)
    session.add(blocked)
    session.commit()
    session.refresh(blocked)
    return blocked

@router.delete("/{term_id}")
def delete_blocked_term(
    term_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    term = session.get(BlockedTerm, term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    session.delete(term)
    session.commit()
    return {"status": "success", "message": "Term removed"}
