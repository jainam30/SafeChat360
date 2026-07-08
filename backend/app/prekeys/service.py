import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
import threading
from app.prekeys.repository import PreKeyRepository
from app.prekeys.models import PreKeyStatus, IdentityPublicKey, SignedPreKey, OneTimePreKey
from app.prekeys.policies import PreKeyPolicies

logger = logging.getLogger(__name__)

class PreKeyBundle:
    def __init__(self, identity_key: IdentityPublicKey, signed_prekey: SignedPreKey, one_time_prekey: Optional[OneTimePreKey]):
        self.identity_key = identity_key
        self.signed_prekey = signed_prekey
        self.one_time_prekey = one_time_prekey

class PreKeyReservationService:
    """
    Ensures safe, atomic distribution of pre-keys to prevent replay attacks.
    """
    
    def __init__(self, repository: PreKeyRepository):
        self.repository = repository
        # Simple lock to mock atomic database transactions for single-use keys
        self._lock = threading.Lock()
        
    def reserve_bundle(self, device_id: str) -> Optional[PreKeyBundle]:
        """
        Fetches the public identity key, active signed pre-key, and exclusively reserves one one-time pre-key.
        """
        ik = self.repository.get_identity_key(device_id)
        if not ik:
            logger.error(f"Cannot reserve bundle: No IdentityKey for {device_id}")
            return None
            
        spk = self.repository.get_active_signed_prekey(device_id)
        if not spk:
            logger.error(f"Cannot reserve bundle: No active SignedPreKey for {device_id}")
            return None
            
        opk = None
        
        with self._lock:
            available_keys = self.repository.get_available_one_time_prekeys(device_id)
            if available_keys:
                # Pick the first available key
                opk = available_keys[0]
                
                # Atomically transition state to prevent concurrent fetching
                opk.status = PreKeyStatus.RESERVED
                opk.reserved_until = datetime.utcnow() + timedelta(minutes=PreKeyPolicies.RESERVATION_TIMEOUT_MINUTES)
                logger.info(f"Reserved OPK {opk.key_id} for device {device_id}")
            else:
                logger.warning(f"Pre-key pool exhausted for {device_id}. Returning bundle without OPK.")
                
        return PreKeyBundle(identity_key=ik, signed_prekey=spk, one_time_prekey=opk)
        
    def confirm_consumption(self, device_id: str, key_id: int) -> bool:
        """
        Permanently marks a reserved key as consumed once the session is successfully established.
        """
        with self._lock:
            opk = self.repository.get_one_time_prekey(device_id, key_id)
            
            if not opk:
                return False
                
            if opk.status == PreKeyStatus.CONSUMED:
                logger.error(f"REPLAY ATTEMPT: OPK {key_id} for {device_id} is already consumed.")
                return False
                
            if opk.status != PreKeyStatus.RESERVED:
                logger.error(f"Cannot consume OPK {key_id} for {device_id}: Status is {opk.status.value}")
                return False
                
            opk.status = PreKeyStatus.CONSUMED
            opk.reserved_until = None
            logger.info(f"Confirmed consumption of OPK {key_id} for {device_id}")
            return True
