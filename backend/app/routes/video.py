from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.video_moderator import moderate_video
import shutil
import os
import tempfile
from app.models import ModerationLog
from app.crud import create_log
from app.db import get_session
from sqlmodel import Session
from app.deps import get_current_user

router = APIRouter(prefix="/api/moderate", tags=["moderation"])

@router.post("/video")
async def moderate_video_endpoint(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    if not file.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video")
        
    # Save upload to temp file
    fd, tmp_path = tempfile.mkstemp(suffix=".mp4")
    os.close(fd)
    
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        # Moderate
        result = moderate_video(tmp_path)
        
        # Log result
        create_log(
            session,
            content_type="video",
            content_excerpt=f"Video: {file.filename}",
            is_flagged=result["is_flagged"],
            details=result,
            source=current_user.email
        )
        
        return {"data": result}
        
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
