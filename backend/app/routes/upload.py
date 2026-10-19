from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request, Query
import os
import uuid
import logging
import struct
import tempfile
from typing import Optional
from PIL import Image
from app.deps import get_current_user
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB
DEFAULT_MAX_VIDEO_DURATION_SECONDS = 60  # Default 60 seconds for video stories

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".mp4", ".webm", ".mp3", ".ogg", ".wav",
}

# Ensure upload directory exists
try:
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
except OSError:
    # Read-only filesystem (Vercel/serverless fallback)
    UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "safechat_uploads")
    if not os.path.exists(UPLOAD_DIR):
        try:
            os.makedirs(UPLOAD_DIR)
        except Exception:
            pass
    logger.warning(f"Using temporary directory for uploads: {UPLOAD_DIR}")


def validate_file_signature(header: bytes, ext: str) -> bool:
    """Validate magic bytes against expected file extension to prevent MIME spoofing."""
    if ext in {".jpg", ".jpeg"}:
        return header.startswith(b"\xff\xd8\xff")
    if ext == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if ext == ".gif":
        return header.startswith(b"GIF87a") or header.startswith(b"GIF89a")
    if ext == ".webp":
        return header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WEBP"
    if ext == ".mp4":
        return len(header) >= 8 and (header[4:8] == b"ftyp" or header[4:8] == b"moov")
    if ext == ".webm":
        return header.startswith(b"\x1a\x45\xdf\xa3")
    if ext == ".mp3":
        return header.startswith(b"ID3") or (len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0)
    if ext == ".ogg":
        return header.startswith(b"OggS")
    if ext == ".wav":
        return header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WAVE"
    return False


def get_mp4_duration_from_file(file_path: str) -> Optional[float]:
    """Parse MP4 box structure to find moov -> mvhd and compute duration in seconds."""
    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read(1024 * 512)  # Inspect first 512KB for headers
            idx = 0
            length = len(file_bytes)
            while idx + 8 <= length:
                box_size = struct.unpack(">I", file_bytes[idx:idx + 4])[0]
                box_type = file_bytes[idx + 4:idx + 8]
                if box_size == 1:
                    if idx + 16 > length:
                        break
                    box_size = struct.unpack(">Q", file_bytes[idx + 8:idx + 16])[0]
                    header_size = 16
                else:
                    header_size = 8

                if box_size < header_size:
                    break

                if box_type == b"moov":
                    sub_idx = idx + header_size
                    sub_end = min(idx + box_size, length)
                    while sub_idx + 8 <= sub_end:
                        sub_size = struct.unpack(">I", file_bytes[sub_idx:sub_idx + 4])[0]
                        sub_type = file_bytes[sub_idx + 4:sub_idx + 8]
                        sub_h_size = 8
                        if sub_size == 1:
                            if sub_idx + 16 > sub_end:
                                break
                            sub_size = struct.unpack(">Q", file_bytes[sub_idx + 8:sub_idx + 16])[0]
                            sub_h_size = 16

                        if sub_type == b"mvhd":
                            payload = file_bytes[sub_idx + sub_h_size:sub_idx + sub_size]
                            if len(payload) >= 20:
                                version = payload[0]
                                if version == 0 and len(payload) >= 20:
                                    timescale, duration = struct.unpack(">II", payload[12:20])
                                    if timescale > 0:
                                        return duration / timescale
                                elif version == 1 and len(payload) >= 32:
                                    timescale, duration = struct.unpack(">IQ", payload[20:32])
                                    if timescale > 0:
                                        return duration / timescale
                            break
                        if sub_size <= 0:
                            break
                        sub_idx += sub_size
                    break

                if box_size <= 0:
                    break
                idx += box_size
    except Exception as e:
        logger.warning(f"Could not parse MP4 duration: {e}")
    return None


@router.post("")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    is_story: bool = Query(default=False, description="Whether this media is uploaded as a story"),
    max_duration: int = Query(default=DEFAULT_MAX_VIDEO_DURATION_SECONDS, description="Max allowed duration for videos"),
    current_user: User = Depends(get_current_user)
):
    """
    Secure, validated file upload endpoint:
    - Validates extension and magic bytes (file signature)
    - Enforces 10MB size limit
    - Validates image integrity using PIL
    - Inspects video duration (max 60s for stories)
    - Returns absolute URL and metadata
    """
    file_path = None
    try:
        # 1. Validate file extension
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File extension not permitted: {file_ext or 'unknown'}")

        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        # 2. Read first chunk for magic bytes validation
        first_chunk = await file.read(512)
        if not first_chunk:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if not validate_file_signature(first_chunk, file_ext):
            raise HTTPException(
                status_code=400,
                detail=f"File signature mismatch. The file content does not match the extension {file_ext}."
            )

        # 3. Stream remaining contents to disk with strict size cap
        size = len(first_chunk)
        with open(file_path, "wb") as buffer:
            buffer.write(first_chunk)
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="File exceeds maximum allowed size of 10MB")
                buffer.write(chunk)

        # 4. Media-specific deep inspection
        media_type = "image" if file_ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else (
            "video" if file_ext in {".mp4", ".webm"} else "audio"
        )

        duration = None

        if media_type == "image":
            # Verify image integrity with PIL
            try:
                with Image.open(file_path) as img:
                    img.verify()
            except Exception as img_err:
                logger.error(f"Image integrity verification failed: {img_err}")
                raise HTTPException(status_code=400, detail="Corrupted or invalid image file.")

        elif media_type == "video":
            if file_ext == ".mp4":
                duration = get_mp4_duration_from_file(file_path)
                if duration is not None:
                    logger.info(f"Detected MP4 video duration: {duration:.2f}s")
                    if (is_story or max_duration) and duration > max_duration:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Video duration ({duration:.1f}s) exceeds the maximum allowed limit of {max_duration} seconds."
                        )

        # 5. Build absolute URL
        forwarded_proto = request.headers.get("x-forwarded-proto")
        forwarded_host = request.headers.get("x-forwarded-host")
        if forwarded_proto and forwarded_host:
            base_url = f"{forwarded_proto}://{forwarded_host}"
        else:
            base_url = str(request.base_url).rstrip("/")

        full_url = f"{base_url}/uploads/{unique_name}"
        relative_url = f"/uploads/{unique_name}"

        return {
            "url": full_url,
            "relative_url": relative_url,
            "filename": unique_name,
            "type": media_type,
            "size": size,
            "duration": round(duration, 2) if duration is not None else None,
        }

    except HTTPException:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        raise
    except Exception as e:
        logger.error(f"Upload failed unexpectedly: {e}", exc_info=True)
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        raise HTTPException(status_code=500, detail="File upload processing failed")
