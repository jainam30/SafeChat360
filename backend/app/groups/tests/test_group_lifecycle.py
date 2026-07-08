import pytest
from app.groups.audit.audit_manager import AuditManager
from app.groups.invitations.invitation_manager import InvitationManager
from app.groups.membership.membership_manager import MembershipManager
from app.groups.repositories.group_repository import GroupRepository
from app.groups.services.group_service import GroupService
from app.groups.roles.role_manager import GroupRole

@pytest.fixture
def service():
    audit = AuditManager()
    invitations = InvitationManager(audit)
    membership = MembershipManager(audit)
    repo = GroupRepository()
    return GroupService(repo, membership, invitations, audit)

def test_create_group(service):
    group = service.create_group("Secret Project", "alice")
    assert group.name == "Secret Project"
    
    # Creator must be owner
    assert "alice" in group.members
    assert group.members["alice"].role == GroupRole.OWNER
    
    # Audit trail
    logs = service.audit.get_logs(group.group_id)
    assert len(logs) == 1
    assert logs[0].action == "GROUP_CREATED"
    assert logs[0].actor_id == "alice"

def test_invite_and_join_flow(service):
    group = service.create_group("Secret Project", "alice")
    
    # Alice invites Bob
    invite = service.invite_user(group.group_id, "alice", "bob")
    assert invite is not None
    assert invite.status == "PENDING"
    
    # Bob accepts
    success = service.accept_invitation(invite.invite_id, "bob")
    assert success is True
    
    assert "bob" in group.members
    assert group.members["bob"].role == GroupRole.MEMBER # Default role
    
    # Bob tries to replay the invite
    success_dup = service.accept_invitation(invite.invite_id, "bob")
    assert success_dup is False # Already ACCEPTED

def test_role_enforcement(service):
    group = service.create_group("Secret Project", "alice") # Alice is OWNER
    
    # Alice invites and adds Bob and Charlie
    invite_b = service.invite_user(group.group_id, "alice", "bob")
    service.accept_invitation(invite_b.invite_id, "bob")
    
    invite_c = service.invite_user(group.group_id, "alice", "charlie")
    service.accept_invitation(invite_c.invite_id, "charlie")
    
    # Bob (MEMBER) tries to kick Charlie (MEMBER)
    success = service.kick_member(group.group_id, "bob", "charlie")
    assert success is False # MEMBER cannot kick MEMBER
    assert "charlie" in group.members
    
    # Alice (OWNER) promotes Bob to ADMIN
    success = service.promote_member(group.group_id, "alice", "bob", GroupRole.ADMIN)
    assert success is True
    assert group.members["bob"].role == GroupRole.ADMIN
    
    # Bob (ADMIN) kicks Charlie (MEMBER)
    success = service.kick_member(group.group_id, "bob", "charlie")
    assert success is True # ADMIN can kick MEMBER
    assert "charlie" not in group.members
    
    # Bob (ADMIN) tries to kick Alice (OWNER)
    success = service.kick_member(group.group_id, "bob", "alice")
    assert success is False # ADMIN cannot kick OWNER
