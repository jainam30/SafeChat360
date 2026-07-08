from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.deps import get_mod_repo
from app.repositories.moderation import ModerationLogRepository

router = APIRouter(prefix="/api")

@router.get("/history", tags=["history"])
def read_history(
    limit: int = Query(50, lte=500), 
    offset: int = 0, 
    content_type: Optional[str] = None, 
    mod_repo: ModerationLogRepository = Depends(get_mod_repo)
):
    logs = mod_repo.get_logs(limit=limit, offset=offset, content_type=content_type)
    return {"status": "success", "data": [l.model_dump() for l in logs]}
