from typing import List, Optional
from sqlmodel import select, Session, or_, and_
from app.models import Message
from app.repositories.base import BaseRepository

class MessageRepository(BaseRepository[Message]):
    def __init__(self, session: Session):
        super().__init__(Message, session)

    def get_group_history(self, group_id: int, limit: int = 50) -> List[Message]:
        statement = select(Message).where(Message.group_id == group_id).order_by(Message.created_at.desc()).limit(limit)
        return self.session.exec(statement).all()

    def get_private_history(self, user1_id: int, user2_id: int, limit: int = 50) -> List[Message]:
        statement = select(Message).where(
            or_(
                and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
            )
        ).order_by(Message.created_at.desc()).limit(limit)
        return self.session.exec(statement).all()

    def get_global_history(self, limit: int = 50) -> List[Message]:
        statement = select(Message).where(Message.receiver_id == None).order_by(Message.created_at.desc()).limit(limit)
        return self.session.exec(statement).all()
