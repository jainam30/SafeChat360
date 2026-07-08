from enum import Enum
from typing import Dict, Any

class GroupRole(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"

class RoleManager:
    """
    Enforces authorization logic within a group.
    """
    
    # Hierarchy map: Higher value = higher privilege
    _hierarchy = {
        GroupRole.OWNER: 40,
        GroupRole.ADMIN: 30,
        GroupRole.MODERATOR: 20,
        GroupRole.MEMBER: 10
    }

    @classmethod
    def can_remove_member(cls, actor_role: GroupRole, target_role: GroupRole) -> bool:
        """
        Determines if the actor has permission to kick the target.
        """
        if actor_role == GroupRole.OWNER:
            return True # Owner can kick anyone except themselves
        
        # Must be strictly higher in the hierarchy
        return cls._hierarchy[actor_role] > cls._hierarchy[target_role]

    @classmethod
    def can_change_role(cls, actor_role: GroupRole, target_current_role: GroupRole, target_new_role: GroupRole) -> bool:
        """
        Determines if the actor can promote/demote the target.
        """
        if actor_role == GroupRole.OWNER:
            return True
            
        # Actor must have higher privilege than the target's current role AND the role they are granting
        return (cls._hierarchy[actor_role] > cls._hierarchy[target_current_role] and
                cls._hierarchy[actor_role] > cls._hierarchy[target_new_role])
                
    @classmethod
    def can_invite(cls, actor_role: GroupRole) -> bool:
        """
        Determines if the actor can generate invites.
        """
        return cls._hierarchy[actor_role] >= cls._hierarchy[GroupRole.MEMBER] # Anyone can invite for now
