from app.repositories.moderation import ModerationLogRepository
from app.repositories.user import UserRepository
from app.models import User
from app.services.text_moderator import moderate_text
from app.services.image_moderator import moderate_image_base64
from app.services.audio_moderator import moderate_audio_base64
from app.schemas.moderation import TextModerationRequest
from app.core.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

class ModerationService:
    def __init__(self, mod_repo: ModerationLogRepository, user_repo: UserRepository):
        self.mod_repo = mod_repo
        self.user_repo = user_repo

    def moderate_text_api(self, request: TextModerationRequest, current_user: User) -> dict:
        # TODO: Inject BlockedTerm repo instead of raw query, skipping for brevity
        result = moderate_text(request.text, additional_keywords=[])
        excerpt = (request.text[:300] + "...") if len(request.text) > 300 else request.text
        is_flagged = bool(result.get("is_flagged"))
        original_language = result.get("original_language", "en")
        
        if is_flagged:
            new_score = max(0, current_user.trust_score - 5)
            self.user_repo.update(db_obj=current_user, obj_in={"trust_score": new_score})

        self.mod_repo.log(
            content_type="text",
            content_excerpt=excerpt,
            is_flagged=is_flagged,
            details=result,
            source=str(current_user.id),
            original_language=original_language
        )
        return {"status": "success", "data": result}

    def moderate_image_base64(self, b64: str, current_user: User, excerpt: str = "image_base64") -> dict:
        if not b64:
            raise APIException(status_code=400, detail="Missing image_base64")
            
        result = moderate_image_base64(b64)
        is_flagged = bool(result.get("is_flagged"))
        
        self.mod_repo.log(
            content_type="image",
            content_excerpt=excerpt,
            is_flagged=is_flagged,
            details=result,
            source=str(current_user.id)
        )
        return {"status": "success", "data": result}

    def moderate_audio_base64(self, b64: str, current_user: User) -> dict:
        if not b64:
            raise APIException(status_code=400, detail="Missing audio_base64")
            
        result = moderate_audio_base64(b64)
        transcript = result.get("transcript", "") if isinstance(result, dict) else ""
        excerpt = (transcript[:300] + "...") if len(transcript) > 300 else transcript
        is_flagged = bool(result.get("moderation", {}).get("is_flagged")) if isinstance(result, dict) else False
        
        self.mod_repo.log(
            content_type="audio",
            content_excerpt=excerpt,
            is_flagged=is_flagged,
            details=result,
            source=str(current_user.id)
        )
        return {"status": "success", "data": result}
