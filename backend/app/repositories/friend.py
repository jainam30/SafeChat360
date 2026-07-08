from typing import Optional, List
from sqlmodel import select, Session
from app.models import Friendship
from app.repositories.base import BaseRepository

class FriendshipRepository(BaseRepository[Friendship]):
    def __init__(self, session: Session):
        super().__init__(Friendship, session)

    def get_friendship(self, user_id: int, friend_id: int) -> Optional[Friendship]:
        statement = select(Friendship).where(
            ((Friendship.user_id == user_id) & (Friendship.friend_id == friend_id)) |
            ((Friendship.user_id == friend_id) & (Friendship.friend_id == user_id))
        )
        return self.session.exec(statement).first()

    def get_friends(self, user_id: int) -> List[int]:
        statement = select(Friendship).where(
            (Friendship.user_id == user_id) | (Friendship.friend_id == user_id)
        )
        friendships = self.session.exec(statement).all()
        friend_ids = []
        for f in friendships:
            if f.status == "accepted":
                if f.user_id == user_id:
                    friend_ids.append(f.friend_id)
                else:
                    friend_ids.append(f.user_id)
        return friend_ids

    def get_requests(self, user_id: int) -> List[Friendship]:
        statement = select(Friendship).where(Friendship.friend_id == user_id, Friendship.status == "pending")
        return self.session.exec(statement).all()
