from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.video_moderator import moderate_video
import shutil
import os
import tempfile
from app.deps import get_current_user, get_mod_repo
from app.repositories.moderation import ModerationLogRepository

router = APIRouter(prefix="/api/moderate", tags=["moderation"])

@router.post("/video")
async def moderate_video_endpoint(
    file: UploadFile = File(...),
    mod_repo: ModerationLogRepository = Depends(get_mod_repo),
    current_user = Depends(get_current_user)
):
    if not file.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video")
        
    fd, tmp_path = tempfile.mkstemp(suffix=".mp4")
    os.close(fd)
    
    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        result = moderate_video(tmp_path)
        
        mod_repo.log(
            content_type="video",
            content_excerpt=f"Video: {file.filename}",
            is_flagged=result.get("is_flagged", False),
            details=result,
            source=current_user.email
        )
        
        return {"data": result}
        
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
