from fastapi import APIRouter, HTTPException, UploadFile, File, Body, Depends
from pydantic import BaseModel
import base64
from typing import Dict, Optional
from sqlmodel import Session
from app.db import get_session
from app.crud import create_log
from app.services.text_moderator import moderate_text
from app.services.image_moderator import moderate_image_base64
from app.services.audio_moderator import moderate_audio_base64
from app.deps import get_current_user

router = APIRouter(prefix="/api", tags=["moderation"])

class TextModerationRequest(BaseModel):
    text: str

@router.post("/moderate/text")
async def moderate_text_api(request: TextModerationRequest, session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    try:
        # Fetch blocked terms
        from app.models import BlockedTerm
        from sqlmodel import select
        blocked_terms = session.exec(select(BlockedTerm.term)).all()
        
        result = moderate_text(request.text, additional_keywords=blocked_terms)
        excerpt = (request.text[:300] + "...") if len(request.text) > 300 else request.text
        is_flagged = bool(result.get("is_flagged"))
        original_language = result.get("original_language")
        
        # Reputation System: Penalize if flagged
        if is_flagged:
            # Simple penalty for now, could be dynamic based on severity
            current_user.trust_score = max(0, current_user.trust_score - 5)
            session.add(current_user)
            session.commit()
            session.refresh(current_user)

        create_log(session, content_type="text", content_excerpt=excerpt, is_flagged=is_flagged, details=result, source=str(current_user.id), original_language=original_language)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/moderate/image-file")
async def moderate_image_file(file: UploadFile = File(...), session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    try:
        contents = await file.read()
        b64 = base64.b64encode(contents).decode("utf-8")
        result = moderate_image_base64(b64)
        excerpt = getattr(file, 'filename', 'image_upload')
        is_flagged = bool(result.get("is_flagged"))
        create_log(session, content_type="image", content_excerpt=excerpt, is_flagged=is_flagged, details=result, source=str(current_user.id))
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/moderate/image-base64")
async def moderate_image_b64(payload: Dict = Body(...), session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    try:
        b64 = payload.get("image_base64")
        if not b64:
            raise HTTPException(status_code=400, detail="Missing image_base64")
        result = moderate_image_base64(b64)
        is_flagged = bool(result.get("is_flagged"))
        create_log(session, content_type="image", content_excerpt="image_base64", is_flagged=is_flagged, details=result, source=str(current_user.id))
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/moderate/audio-base64")
async def moderate_audio_b64(payload: Dict = Body(...), session: Session = Depends(get_session), current_user = Depends(get_current_user)):
    try:
        b64 = payload.get("audio_base64")
        if not b64:
            raise HTTPException(status_code=400, detail="Missing audio_base64")
        result = moderate_audio_base64(b64)
        transcript = result.get("transcript", "") if isinstance(result, dict) else ""
        excerpt = (transcript[:300] + "...") if len(transcript) > 300 else transcript
        is_flagged = bool(result.get("moderation", {}).get("is_flagged")) if isinstance(result, dict) else False
        create_log(session, content_type="audio", content_excerpt=excerpt, is_flagged=is_flagged, details=result, source=str(current_user.id))
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
