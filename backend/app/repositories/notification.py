from typing import List
from sqlmodel import select, Session
from app.models import Notification
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, session: Session):
        super().__init__(Notification, session)

    def get_for_user(self, user_id: int, limit: int = 50) -> List[Notification]:
        statement = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(limit)
        return self.session.exec(statement).all()
