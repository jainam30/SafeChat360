from fastapi import APIRouter, UploadFile, File, Body, Depends
import base64
from typing import Dict
from app.deps import get_current_user, get_mod_service
from app.schemas.moderation import TextModerationRequest
from app.services.moderation import ModerationService

router = APIRouter(prefix="/api", tags=["moderation"])

@router.post("/moderate/text")
async def moderate_text_api(
    request: TextModerationRequest, 
    current_user = Depends(get_current_user),
    service: ModerationService = Depends(get_mod_service)
):
    return service.moderate_text_api(request, current_user)

@router.post("/moderate/image-file")
async def moderate_image_file(
    file: UploadFile = File(...), 
    current_user = Depends(get_current_user),
    service: ModerationService = Depends(get_mod_service)
):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    excerpt = getattr(file, 'filename', 'image_upload')
    return service.moderate_image_base64(b64, current_user, excerpt)

@router.post("/moderate/image-base64")
async def moderate_image_b64(
    payload: Dict = Body(...), 
    current_user = Depends(get_current_user),
    service: ModerationService = Depends(get_mod_service)
):
    return service.moderate_image_base64(payload.get("image_base64"), current_user)

@router.post("/moderate/audio-base64")
async def moderate_audio_b64(
    payload: Dict = Body(...), 
    current_user = Depends(get_current_user),
    service: ModerationService = Depends(get_mod_service)
):
    return service.moderate_audio_base64(payload.get("audio_base64"), current_user)
