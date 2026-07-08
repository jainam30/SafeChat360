from datetime import datetime, timedelta
from typing import Optional
from ..repositories.prekey_repo import PrekeyRepository
from ..models.keys import SignedPrekey
import logging

logger = logging.getLogger(__name__)

class SignedPrekeyManager:
    """
    Manages the lifecycle, rotation, and retirement of Signed Prekeys.
    """
    def __init__(self, repo: PrekeyRepository):
        self.repo = repo
        self.rotation_interval = timedelta(days=7) # Typical Signal protocol interval

    async def generate_and_store(
        self, user_id: int, device_id: str, key_id: int, 
        public_key_b64: str, signature_b64: str
    ) -> SignedPrekey:
        """
        Registers a new Signed Prekey uploaded by the client.
        Automatically retires the previously active one.
        """
        expires_at = datetime.utcnow() + self.rotation_interval
        
        spk = SignedPrekey(
            key_id=key_id,
            public_key_b64=public_key_b64,
            signature_b64=signature_b64,
            expires_at=expires_at,
            status="ACTIVE"
        )
        
        await self.repo.insert_signed_prekey(user_id, device_id, spk)
        logger.info(f"Registered new SignedPrekey(ID={key_id}) for {device_id}")
        return spk

    async def get_active_key(self, user_id: int, device_id: str) -> Optional[SignedPrekey]:
        spk = await self.repo.get_active_signed_prekey(user_id, device_id)
        if spk and spk.expires_at < datetime.utcnow():
            spk.status = "EXPIRED" # Needs rotation
            # Typically we'd save this state back to the repo, but handled by Scheduler
            return None
        return spk
