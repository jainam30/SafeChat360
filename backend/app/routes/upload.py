from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import shutil
import os
import uuid
import logging
from pydantic import BaseModel
from app.deps import get_current_user
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".mp4", ".webm", ".mp3", ".ogg", ".wav",
}

# Ensure upload directory exists (Robust for Vercel)
import tempfile

try:
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
except OSError:
    # Read-only filesystem (Vercel)
    UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "safechat_uploads")
    if not os.path.exists(UPLOAD_DIR):
        try:
            os.makedirs(UPLOAD_DIR)
        except Exception:
            pass
    logger.warning(f"Using temporary directory for uploads: {UPLOAD_DIR}")


@router.post("")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        # Validate extension
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type not allowed: {file_ext or 'unknown'}")

        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        # Stream to disk with a hard size cap (no temp file left behind on reject)
        size = 0
        try:
            with open(file_path, "wb") as buffer:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_UPLOAD_BYTES:
                        raise HTTPException(status_code=413, detail="File exceeds maximum allowed size of 10MB")
                    buffer.write(chunk)
        except HTTPException:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise

        return {
            "url": f"/uploads/{unique_name}",
            "type": "image" if (file.content_type or "").startswith("image") else "video",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
