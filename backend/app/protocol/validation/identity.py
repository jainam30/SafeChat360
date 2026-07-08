from typing import Optional
from app.services.identity.service import IdentityService
from app.services.devices.service import DeviceService
from app.protocol.errors.codes import ProtocolException, SCPErrorCode

class IdentityVerificationEngine:
    def __init__(self, identity_service: IdentityService, device_service: DeviceService):
        self.identity_service = identity_service
        self.device_service = device_service

    def verify_device_identity(self, user_id: int, device_id: str) -> str:
        """
        Verifies that the device is registered and trusted, 
        and retrieves its public Identity Key for challenge verification.
        """
        if not self.device_service.is_device_trusted(user_id, device_id):
            raise ProtocolException(
                code=SCPErrorCode.AUTHENTICATION_REQUIRED,
                message="Device is untrusted or revoked.",
                is_recoverable=False
            )

        identity_meta = self.identity_service.get_identity(user_id)
        # Assuming identity_meta tracks device-specific keys in a real implementation
        public_key_b64 = identity_meta.get("identity_key_b64")
        
        if not public_key_b64:
            raise ProtocolException(
                code=SCPErrorCode.KEY_UNAVAILABLE,
                message="Identity Key not found for this device.",
                is_recoverable=False
            )

        return public_key_b64
