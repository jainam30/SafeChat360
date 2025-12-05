from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlmodel import Session
from app.db import get_session
from app import crud

router = APIRouter(prefix="/api")

@router.get("/history", tags=["history"])
def read_history(limit: int = Query(50, lte=500), offset: int = 0, content_type: Optional[str] = None, session: Session = Depends(get_session)):
    logs = crud.get_logs(session, limit=limit, offset=offset, content_type=content_type)
    return {"status": "success", "data": [l.dict() for l in logs]}
