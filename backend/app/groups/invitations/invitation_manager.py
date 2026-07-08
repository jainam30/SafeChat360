import logging
import uuid
from typing import Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from app.groups.audit.audit_manager import AuditManager, AuditRecord

logger = logging.getLogger(__name__)

class GroupInvitation(BaseModel):
    invite_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    inviter_id: str
    invitee_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    status: str = "PENDING" # PENDING, ACCEPTED, REJECTED, REVOKED

class InvitationManager:
    """
    Handles the lifecycle of group invitations, preventing replays and enforcing expirations.
    """
    
    def __init__(self, audit_manager: AuditManager):
        self.audit_manager = audit_manager
        # invite_id -> GroupInvitation
        self._invites: Dict[str, GroupInvitation] = {}
        
    def generate_invitation(self, group_id: str, inviter_id: str, invitee_id: str, expires_in_hours: int = 24) -> GroupInvitation:
        # Prevent duplicate pending invites
        for inv in self._invites.values():
            if inv.group_id == group_id and inv.invitee_id == invitee_id and inv.status == "PENDING":
                if inv.expires_at > datetime.utcnow():
                    logger.warning(f"Active invitation already exists for {invitee_id} to {group_id}")
                    return inv # Return existing
                    
        invite = GroupInvitation(
            group_id=group_id,
            inviter_id=inviter_id,
            invitee_id=invitee_id,
            expires_at=datetime.utcnow() + timedelta(hours=expires_in_hours)
        )
        self._invites[invite.invite_id] = invite
        
        self.audit_manager.append(AuditRecord(
            group_id=group_id,
            action="INVITATION_CREATED",
            actor_id=inviter_id,
            target_id=invitee_id,
            details={"invite_id": invite.invite_id}
        ))
        return invite
        
    def accept_invitation(self, invite_id: str, user_id: str) -> Optional[GroupInvitation]:
        """
        Attempts to consume an invite. Returns the invite if valid, None if invalid.
        """
        invite = self._invites.get(invite_id)
        if not invite:
            return None
            
        if invite.invitee_id != user_id:
            logger.error(f"User {user_id} attempted to accept invite {invite_id} meant for {invite.invitee_id}")
            return None
            
        if invite.status != "PENDING":
            logger.error(f"Invite {invite_id} is already {invite.status} (Replay Attempt)")
            return None
            
        if datetime.utcnow() > invite.expires_at:
            logger.info(f"Invite {invite_id} expired")
            invite.status = "EXPIRED"
            return None
            
        invite.status = "ACCEPTED"
        
        self.audit_manager.append(AuditRecord(
            group_id=invite.group_id,
            action="INVITATION_ACCEPTED",
            actor_id=user_id,
            details={"invite_id": invite.invite_id}
        ))
        return invite
