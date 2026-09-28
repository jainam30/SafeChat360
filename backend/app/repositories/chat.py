from typing import List, Optional, Dict
from sqlmodel import select, Session, or_, and_, func
from app.models import Message, MessageReadState
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
        statement = select(Message).where(Message.receiver_id == None).order_by(Message.created_at.desc()).limit(limit)  # noqa: E711
        return self.session.exec(statement).all()

    # ------------------------------------------------------------------
    # Last-message helpers (power the chat sidebar previews)
    # ------------------------------------------------------------------
    def get_last_private_message(self, user1_id: int, user2_id: int) -> Optional[Message]:
        statement = select(Message).where(
            or_(
                and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
            )
        ).order_by(Message.created_at.desc()).limit(1)
        return self.session.exec(statement).first()

    def get_last_group_message(self, group_id: int) -> Optional[Message]:
        statement = select(Message).where(Message.group_id == group_id).order_by(Message.created_at.desc()).limit(1)
        return self.session.exec(statement).first()

    # ------------------------------------------------------------------
    # Read-state tracking (powers unread badges)
    # ------------------------------------------------------------------
    def mark_read(self, user_id: int, message_ids: List[int]) -> int:
        """Idempotently mark messages as read by a user. Returns number of new rows."""
        if not message_ids:
            return 0
        already = set(
            self.session.exec(
                select(MessageReadState.message_id).where(
                    MessageReadState.user_id == user_id,
                    MessageReadState.message_id.in_(message_ids),
                )
            ).all()
        )
        created = 0
        for mid in message_ids:
            if mid in already:
                continue
            self.session.add(MessageReadState(user_id=user_id, message_id=mid))
            created += 1
        if created:
            self.session.commit()
        return created

    def _unread_base_filters(self, user_id: int):
        """Messages NOT sent by the user and NOT yet marked read by them."""
        read_ids = select(MessageReadState.message_id).where(MessageReadState.user_id == user_id)
        return [
            Message.sender_id != user_id,
            Message.is_unsent == False,  # noqa: E712
            Message.id.not_in(read_ids),
        ]

    def count_unread_private(self, user_id: int, other_user_id: int) -> int:
        filters = self._unread_base_filters(user_id) + [
            or_(
                and_(Message.sender_id == other_user_id, Message.receiver_id == user_id),
            )
        ]
        statement = select(func.count()).select_from(Message).where(*filters)
        return self.session.exec(statement).one()

    def count_unread_global(self, user_id: int, since: Optional[Message] = None) -> int:
        filters = self._unread_base_filters(user_id) + [
            Message.receiver_id == None,  # noqa: E711
            Message.group_id == None,     # noqa: E711
        ]
        statement = select(func.count()).select_from(Message).where(*filters)
        return self.session.exec(statement).one()

    def count_unread_group(self, user_id: int, group_id: int) -> int:
        filters = self._unread_base_filters(user_id) + [Message.group_id == group_id]
        statement = select(func.count()).select_from(Message).where(*filters)
        return self.session.exec(statement).one()

    def unread_ids(self, user_id: int, other_user_id: Optional[int] = None, group_id: Optional[int] = None) -> List[int]:
        filters = self._unread_base_filters(user_id)
        if other_user_id is not None:
            filters.append(Message.sender_id == other_user_id)
        elif group_id is not None:
            filters.append(Message.group_id == group_id)
        else:
            filters.append(Message.receiver_id == None)  # noqa: E711
            filters.append(Message.group_id == None)     # noqa: E711
        statement = select(Message.id).where(*filters).order_by(Message.created_at.desc()).limit(200)
        return list(self.session.exec(statement).all())
