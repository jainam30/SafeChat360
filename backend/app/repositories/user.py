from typing import Optional, List
from sqlmodel import select, Session
from app.models import User, UserSession
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session):
        super().__init__(User, session)

    def get_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def get_by_username(self, username: str) -> Optional[User]:
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()

    def get_by_phone(self, phone: str) -> Optional[User]:
        statement = select(User).where(User.phone_number == phone)
        return self.session.exec(statement).first()

    def get_users_by_ids(self, user_ids: List[int]) -> List[User]:
        if not user_ids:
            return []
        statement = select(User).where(User.id.in_(user_ids))
        return self.session.exec(statement).all()

    # Session methods
    def create_user_session(self, user_id: int, device_id: str) -> UserSession:
        user_session = UserSession(user_id=user_id, device_id=device_id)
        self.session.add(user_session)
        self.session.commit()
        self.session.refresh(user_session)
        return user_session

    def get_active_sessions_count(self, user_id: int) -> int:
        statement = select(UserSession).where(UserSession.user_id == user_id, UserSession.is_active == True)
        results = self.session.exec(statement).all()
        return len(results)

    def deactivate_sessions(self, user_id: int):
        statement = select(UserSession).where(UserSession.user_id == user_id, UserSession.is_active == True)
        sessions = self.session.exec(statement).all()
        for s in sessions:
            s.is_active = False
            self.session.add(s)
        self.session.commit()
