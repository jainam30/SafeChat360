import uuid
from typing import Optional
from ..repositories.prekey_repo import PrekeyRepository
from ..models.bundle import PrekeyBundle
from .signed_prekey_manager import SignedPrekeyManager
from .one_time_prekey_manager import OneTimePrekeyManager

class PrekeyBundleGenerator:
    """
    Assembles the final X3DH bundle to be served to requesting clients.
    """
    def __init__(
        self, 
        spk_manager: SignedPrekeyManager, 
        opk_manager: OneTimePrekeyManager, 
        repo: PrekeyRepository
    ):
        self.spk_manager = spk_manager
        self.opk_manager = opk_manager
        self.repo = repo

    async def generate_bundle(
        self, user_id: int, device_id: str, identity_pub_b64: str, capabilities: list
    ) -> Optional[PrekeyBundle]:
        
        spk = await self.spk_manager.get_active_key(user_id, device_id)
        if not spk:
            return None # Missing or expired
            
        opk = await self.opk_manager.consume_key(user_id, device_id)
        # If opk is None, it means the client is exhausted. X3DH can fallback to just SPK,
        # but for maximum security we require an OPK in this implementation or handle fallback elsewhere.
        if not opk:
            return None

        bundle = PrekeyBundle(
            bundle_id=str(uuid.uuid4()),
            device_id=device_id,
            identity_public_key_b64=identity_pub_b64,
            signed_prekey_id=spk.key_id,
            signed_prekey_public_b64=spk.public_key_b64,
            signed_prekey_signature_b64=spk.signature_b64,
            one_time_prekey_id=opk.key_id,
            one_time_prekey_public_b64=opk.public_key_b64,
            capabilities=capabilities
        )
        
        # Save bundle metadata to repo for auditing
        await self.repo.store_bundle(user_id, device_id, bundle)
        return bundle
