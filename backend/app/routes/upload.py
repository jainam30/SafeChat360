from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Ensure upload directory exists
import tempfile

# Ensure upload directory exists (Robust for Vercel)
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
        except:
             pass 
    print(f"WARNING: Using temporary directory for uploads: {UPLOAD_DIR}")

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return URL (assuming static mount at /uploads)
        # Note: In production (Vercel), this local storage won't work perfectly for persistence,
        # but is required for the demo to function now.
        return {
            "url": f"http://localhost:8000/uploads/{unique_name}", 
            "type": "image" if file.content_type.startswith("image") else "video"
        }
    except Exception as e:
        print(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
