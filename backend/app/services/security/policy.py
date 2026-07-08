from typing import List, Optional
from app.models import User
from app.core.exceptions import APIException
from app.services.devices.service import DeviceService
from app.services.identity.service import IdentityService

class PolicyService:
    """
    Centralizes Authorization (AuthZ) logic and Security Policies.
    """
    def __init__(self, device_service: DeviceService, identity_service: IdentityService):
        self.device_service = device_service
        self.identity_service = identity_service

    def enforce_trusted_device(self, user_id: int, device_id: str):
        devices = self.device_service.get_trusted_devices(user_id)
        if device_id not in [d.device_id for d in devices]:
            raise APIException(status_code=403, detail="Device is not trusted or has been revoked.")

    def enforce_verified_identity(self, user_id: int):
        identity = self.identity_service.get_identity(user_id)
        if not identity.get("verified"):
            raise APIException(status_code=403, detail="Identity verification required.")

    def can_send_message(self, sender: User, receiver_id: Optional[int], group_id: Optional[int]) -> bool:
        # Check basic trust score
        if sender.trust_score < 10:
            raise APIException(status_code=403, detail="Trust score too low to send messages.")
            
        # In a full implementation, this checks blocklists, group memberships, etc.
        return True
