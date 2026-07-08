from typing import Optional
from ..managers.bundle_generator import PrekeyBundleGenerator
from ..models.bundle import PrekeyBundle
from ..validators.prekey_validator import PrekeyValidator

class BundleDistributionService:
    """
    Distributes X3DH bundles to requesting clients.
    """
    def __init__(self, generator: PrekeyBundleGenerator, validator: PrekeyValidator):
        self.generator = generator
        self.validator = validator

    async def fetch_bundle(self, requester_id: int, target_user_id: int, target_device_id: str) -> Optional[PrekeyBundle]:
        # Typically we'd check if requester is authorized to talk to target_user_id (e.g. they are friends).
        # We assume authorization is handled by an upstream dependency.
        
        # We need the target's identity public key. We mock it here.
        mock_identity_b64 = "mock_identity_key"
        mock_caps = ["SUPPORTS_IDENTITY_KEYS"]
        
        bundle = await self.generator.generate_bundle(
            target_user_id, target_device_id, mock_identity_b64, mock_caps
        )
        
        if bundle and self.validator.validate_bundle(bundle):
            return bundle
            
        return None
