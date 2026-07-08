import logging
from typing import Optional
from app.groups.repositories.group_repository import GroupRepository
from app.groups.membership.membership_manager import MembershipManager
from app.groups.invitations.invitation_manager import InvitationManager, GroupInvitation
from app.groups.audit.audit_manager import AuditManager, AuditRecord
from app.groups.models.group import GroupState
from app.groups.roles.role_manager import GroupRole

logger = logging.getLogger(__name__)

class GroupService:
    """
    Facade for all group administrative actions.
    """
    
    def __init__(self, repository: GroupRepository, membership: MembershipManager, 
                 invitations: InvitationManager, audit: AuditManager):
        self.repository = repository
        self.membership = membership
        self.invitations = invitations
        self.audit = audit
        
    def create_group(self, name: str, creator_id: str) -> GroupState:
        group = self.repository.create(name, creator_id)
        
        self.audit.append(AuditRecord(
            group_id=group.group_id,
            action="GROUP_CREATED",
            actor_id=creator_id,
            details={"name": name}
        ))
        return group
        
    def invite_user(self, group_id: str, inviter_id: str, invitee_id: str) -> Optional[GroupInvitation]:
        group = self.repository.get(group_id)
        if not group:
            return None
            
        # Check if inviter is in group
        if inviter_id not in group.members:
            logger.error(f"User {inviter_id} cannot invite to {group_id}: Not a member.")
            return None
            
        # In a real app, we'd check RoleManager.can_invite(group.members[inviter_id].role)
        
        return self.invitations.generate_invitation(group_id, inviter_id, invitee_id)
        
    def accept_invitation(self, invite_id: str, user_id: str) -> bool:
        invite = self.invitations.accept_invitation(invite_id, user_id)
        if not invite:
            return False
            
        group = self.repository.get(invite.group_id)
        if not group:
            return False
            
        return self.membership.add_member(group, actor_id=user_id, new_user_id=user_id)
        
    def kick_member(self, group_id: str, actor_id: str, target_id: str) -> bool:
        group = self.repository.get(group_id)
        if not group:
            return False
            
        return self.membership.remove_member(group, actor_id, target_id)
        
    def promote_member(self, group_id: str, actor_id: str, target_id: str, new_role: GroupRole) -> bool:
        group = self.repository.get(group_id)
        if not group:
            return False
            
        return self.membership.change_role(group, actor_id, target_id, new_role)
