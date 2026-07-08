import logging
from typing import Dict
from app.groups.models.group import GroupState, GroupMember
from app.groups.roles.role_manager import RoleManager, GroupRole
from app.groups.audit.audit_manager import AuditManager, AuditRecord

logger = logging.getLogger(__name__)

class MembershipManager:
    """
    Manages the roster of a group.
    Enforces role hierarchy before applying mutations.
    """
    
    def __init__(self, audit_manager: AuditManager):
        self.audit_manager = audit_manager
        
    def add_member(self, group: GroupState, actor_id: str, new_user_id: str, role: GroupRole = GroupRole.MEMBER) -> bool:
        """
        Forcefully adds a member (usually used after an invite is accepted, where actor is system or the user themselves,
        or when an admin directly adds someone).
        """
        if new_user_id in group.members:
            logger.warning(f"User {new_user_id} is already in group {group.group_id}")
            return False
            
        # In a real app, we'd verify actor_id has permission if it's a direct add.
        # For invites, the actor is technically the user accepting the invite.
            
        group.members[new_user_id] = GroupMember(user_id=new_user_id, role=role)
        
        self.audit_manager.append(AuditRecord(
            group_id=group.group_id,
            action="MEMBER_ADDED",
            actor_id=actor_id,
            target_id=new_user_id,
            details={"role": role.value}
        ))
        return True

    def remove_member(self, group: GroupState, actor_id: str, target_id: str) -> bool:
        """
        Kicks a member. Enforces role hierarchy.
        """
        if actor_id not in group.members:
            return False
            
        if target_id not in group.members:
            return False
            
        actor_role = group.members[actor_id].role
        target_role = group.members[target_id].role
        
        # Self-leave is always allowed
        if actor_id != target_id:
            if not RoleManager.can_remove_member(actor_role, target_role):
                logger.error(f"User {actor_id} ({actor_role}) lacks permission to remove {target_id} ({target_role})")
                return False
                
        del group.members[target_id]
        
        action = "MEMBER_LEFT" if actor_id == target_id else "MEMBER_REMOVED"
        self.audit_manager.append(AuditRecord(
            group_id=group.group_id,
            action=action,
            actor_id=actor_id,
            target_id=target_id
        ))
        return True
        
    def change_role(self, group: GroupState, actor_id: str, target_id: str, new_role: GroupRole) -> bool:
        """
        Promotes or demotes a member. Enforces hierarchy.
        """
        if actor_id not in group.members or target_id not in group.members:
            return False
            
        actor_role = group.members[actor_id].role
        target_role = group.members[target_id].role
        
        if not RoleManager.can_change_role(actor_role, target_role, new_role):
            logger.error(f"User {actor_id} ({actor_role}) lacks permission to change {target_id} to {new_role}")
            return False
            
        group.members[target_id].role = new_role
        
        self.audit_manager.append(AuditRecord(
            group_id=group.group_id,
            action="ROLE_CHANGED",
            actor_id=actor_id,
            target_id=target_id,
            details={"old_role": target_role.value, "new_role": new_role.value}
        ))
        return True
