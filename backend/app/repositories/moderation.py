from typing import Optional, List, Any
import json
from sqlmodel import select, Session
from app.models import ModerationLog
from app.repositories.base import BaseRepository

class ModerationLogRepository(BaseRepository[ModerationLog]):
    def __init__(self, session: Session):
        super().__init__(ModerationLog, session)

    def log(self, content_type: str, content_excerpt: Optional[str], is_flagged: bool, details: Any, source: str, original_language: str = "en") -> ModerationLog:
        if isinstance(details, (dict, list)):
            details_str = json.dumps(details)
        else:
            details_str = str(details)
            
        log_entry = ModerationLog(
            content_type=content_type,
            content_excerpt=content_excerpt[:100] if content_excerpt else None,
            is_flagged=is_flagged,
            details=details_str,
            source=str(source) if source else None,
            original_language=original_language,
            review_status="pending" if is_flagged else "approved"
        )
        self.session.add(log_entry)
        self.session.commit()
        self.session.refresh(log_entry)
        return log_entry

    def get_logs(self, limit: int = 50, offset: int = 0, content_type: Optional[str] = None) -> List[ModerationLog]:
        statement = select(ModerationLog)
        if content_type:
            statement = statement.where(ModerationLog.content_type == content_type)
        statement = statement.offset(offset).limit(limit).order_by(ModerationLog.created_at.desc())
        return self.session.exec(statement).all()
