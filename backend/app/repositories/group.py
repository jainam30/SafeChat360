from typing import List, Optional
from sqlmodel import select, Session
from app.models import Group, GroupMember
from app.repositories.base import BaseRepository

class GroupRepository(BaseRepository[Group]):
    def __init__(self, session: Session):
        super().__init__(Group, session)

    def get_user_groups(self, user_id: int) -> List[Group]:
        memberships = self.session.exec(select(GroupMember).where(GroupMember.user_id == user_id)).all()
        if not memberships:
            return []
        group_ids = [m.group_id for m in memberships]
        return self.session.exec(select(Group).where(Group.id.in_(group_ids))).all()

    def get_members(self, group_id: int) -> List[GroupMember]:
        return self.session.exec(select(GroupMember).where(GroupMember.group_id == group_id)).all()

    def add_member(self, group_id: int, user_id: int) -> GroupMember:
        member = GroupMember(group_id=group_id, user_id=user_id)
        self.session.add(member)
        self.session.commit()
        self.session.refresh(member)
        return member

    def is_member(self, group_id: int, user_id: int) -> bool:
        return self.session.exec(select(GroupMember).where(
            (GroupMember.group_id == group_id) & (GroupMember.user_id == user_id)
        )).first() is not None
