import logging
from typing import List
from datetime import datetime
from app.prekeys.repository import PreKeyRepository
from app.prekeys.models import OneTimePreKey, SignedPreKey, PreKeyStatus
from app.prekeys.policies import PreKeyPolicies

logger = logging.getLogger(__name__)

class PreKeyManager:
    """
    Manages the upload, rotation, and lifecycle of public pre-keys.
    """
    
    def __init__(self, repository: PreKeyRepository):
        self.repository = repository
        
    def handle_batch_upload(self, device_id: str, keys: List[OneTimePreKey]) -> bool:
        """
        Processes a batch upload of One-Time Pre-Keys.
        """
        if len(keys) > PreKeyPolicies.MAX_BATCH_UPLOAD_SIZE:
            logger.error(f"Batch upload for {device_id} exceeds max size ({PreKeyPolicies.MAX_BATCH_UPLOAD_SIZE}).")
            return False
            
        # Prevent duplicate key IDs for the same device
        existing = self.repository._one_time_prekeys.get(device_id, {})
        for key in keys:
            if key.key_id in existing:
                logger.error(f"Duplicate key ID {key.key_id} in upload for {device_id}.")
                return False
                
        self.repository.store_one_time_prekeys(device_id, keys)
        return True

    def check_pool_status(self, device_id: str) -> dict:
        """
        Returns the health of the pre-key pool and indicates if replenishment is needed.
        """
        available_keys = self.repository.get_available_one_time_prekeys(device_id)
        count = len(available_keys)
        
        needs_replenishment = count < PreKeyPolicies.LOW_WATERMARK_THRESHOLD
        
        return {
            "device_id": device_id,
            "available_count": count,
            "needs_replenishment": needs_replenishment
        }

    def rotate_signed_prekey(self, device_id: str, new_spk: SignedPreKey) -> bool:
        """
        Rotates the active signed prekey.
        """
        # Mark current active SPK as EXPIRED (but keep it around for grace period)
        current_spk = self.repository.get_active_signed_prekey(device_id)
        if current_spk:
            logger.info(f"Marking SPK {current_spk.key_id} as EXPIRED for device {device_id}")
            current_spk.status = PreKeyStatus.EXPIRED
            
        self.repository.store_signed_prekey(new_spk)
        return True
