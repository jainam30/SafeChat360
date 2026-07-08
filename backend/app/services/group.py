from app.repositories.group import GroupRepository
from app.repositories.user import UserRepository
from app.models import User
from app.core.exceptions import APIException
from app.schemas.group import GroupCreate
import logging

logger = logging.getLogger(__name__)

class GroupService:
    def __init__(self, group_repo: GroupRepository, user_repo: UserRepository):
        self.group_repo = group_repo
        self.user_repo = user_repo

    def create_group(self, group_in: GroupCreate, current_user: User) -> dict:
        group_data = {"name": group_in.name, "admin_id": current_user.id}
        group = self.group_repo.create(obj_in=group_data)
        
        self.group_repo.add_member(group.id, current_user.id)
        
        for uid in group_in.member_ids:
            if uid != current_user.id:
                if self.user_repo.get(uid):
                    self.group_repo.add_member(group.id, uid)
                    
        members = self.group_repo.get_members(group.id)
        
        return {
            "id": group.id,
            "name": group.name,
            "admin_id": group.admin_id,
            "member_count": len(members)
        }

    def get_my_groups(self, current_user: User) -> list:
        groups = self.group_repo.get_user_groups(current_user.id)
        results = []
        for g in groups:
            members = self.group_repo.get_members(g.id)
            results.append({
                "id": g.id,
                "name": g.name,
                "admin_id": g.admin_id,
                "member_count": len(members)
            })
        return results

    def get_group_members(self, group_id: int, current_user: User) -> list:
        if not self.group_repo.is_member(group_id, current_user.id):
            raise APIException(status_code=403, detail="Not a member")
            
        group = self.group_repo.get(group_id)
        members = self.group_repo.get_members(group_id)
        users = []
        for m in members:
            u = self.user_repo.get(m.user_id)
            if u:
                users.append({
                    "id": u.id,
                    "username": u.username,
                    "profile_photo": u.profile_photo,
                    "is_admin": u.id == group.admin_id
                })
        return users
