import pytest
import asyncio
from app.services.identity.service import IdentityService
from app.services.security.policy import PolicyService
from app.events.bus import EventBus
from app.audit.service import AuditService
from app.core.exceptions import APIException
from app.utils.security import verify_password, get_secure_password_hash

class MockAudit:
    def log_action(self, *args, **kwargs):
        pass

class MockDeviceService:
    def get_trusted_devices(self, user_id):
        class MockDevice:
            device_id = "trusted_dev"
        return [MockDevice()]

@pytest.mark.asyncio
async def test_identity_service():
    bus = EventBus()
    audit = MockAudit()
    service = IdentityService(bus, audit)
    
    identity = service.get_identity(1)
    assert identity["verified"] is False
    
    await service.verify_identity(1)
    identity = service.get_identity(1)
    assert identity["verified"] is True
    
    await service.link_public_key_metadata(1, "key_123")
    identity = service.get_identity(1)
    assert identity["has_public_key"] is True
    assert identity["primary_key_id"] == "key_123"

def test_policy_service():
    audit = MockAudit()
    bus = EventBus()
    device_service = MockDeviceService()
    identity_service = IdentityService(bus, audit)
    identity_service._identity_metadata[1] = {"verified": True}
    
    policy = PolicyService(device_service, identity_service)
    
    # Device trust
    policy.enforce_trusted_device(1, "trusted_dev")  # Should pass
    
    with pytest.raises(APIException):
        policy.enforce_trusted_device(1, "untrusted_dev")
        
    # Identity verification
    policy.enforce_verified_identity(1) # Should pass
    
    with pytest.raises(APIException):
        policy.enforce_verified_identity(2) # 2 is not verified

def test_password_migration():
    # Simulate a raw bcrypt legacy hash
    from passlib.context import CryptContext
    legacy_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    legacy_hash = legacy_context.hash("mypassword")
    
    # Verify legacy password seamlessly (returns True, needs_upgrade=True)
    is_valid, needs_upgrade = verify_password("mypassword", legacy_hash)
    assert is_valid is True
    assert needs_upgrade is True
    
    # Simulate a modern password
    new_hash = get_secure_password_hash("mypassword")
    is_valid_new, needs_upgrade_new = verify_password("mypassword", new_hash)
    assert is_valid_new is True
    assert needs_upgrade_new is False
