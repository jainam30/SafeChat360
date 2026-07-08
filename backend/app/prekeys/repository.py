import logging
from typing import Dict, List, Optional
from app.prekeys.models import IdentityPublicKey, SignedPreKey, OneTimePreKey, PreKeyStatus

logger = logging.getLogger(__name__)

class PreKeyRepository:
    """
    In-memory mock database for PreKeys.
    Keys are siloed strictly by device_id.
    """
    
    def __init__(self):
        # device_id -> IdentityPublicKey
        self._identity_keys: Dict[str, IdentityPublicKey] = {}
        # device_id -> Dict[key_id, SignedPreKey]
        self._signed_prekeys: Dict[str, Dict[int, SignedPreKey]] = {}
        # device_id -> Dict[key_id, OneTimePreKey]
        self._one_time_prekeys: Dict[str, Dict[int, OneTimePreKey]] = {}
        
    def store_identity_key(self, key: IdentityPublicKey) -> None:
        self._identity_keys[key.device_id] = key
        logger.info(f"Stored IdentityKey for device {key.device_id}")

    def get_identity_key(self, device_id: str) -> Optional[IdentityPublicKey]:
        return self._identity_keys.get(device_id)

    def store_signed_prekey(self, key: SignedPreKey) -> None:
        if key.device_id not in self._signed_prekeys:
            self._signed_prekeys[key.device_id] = {}
        self._signed_prekeys[key.device_id][key.key_id] = key
        logger.info(f"Stored SignedPreKey {key.key_id} for device {key.device_id}")

    def get_active_signed_prekey(self, device_id: str) -> Optional[SignedPreKey]:
        # Returns the newest active SPK
        spks = self._signed_prekeys.get(device_id, {}).values()
        active_spks = [k for k in spks if k.status == PreKeyStatus.ACTIVE]
        if not active_spks:
            return None
        return max(active_spks, key=lambda k: k.created_at)

    def get_signed_prekey(self, device_id: str, key_id: int) -> Optional[SignedPreKey]:
        return self._signed_prekeys.get(device_id, {}).get(key_id)

    def store_one_time_prekeys(self, device_id: str, keys: List[OneTimePreKey]) -> None:
        if device_id not in self._one_time_prekeys:
            self._one_time_prekeys[device_id] = {}
            
        for key in keys:
            self._one_time_prekeys[device_id][key.key_id] = key
            
        logger.info(f"Stored {len(keys)} OneTimePreKeys for device {device_id}")

    def get_one_time_prekey(self, device_id: str, key_id: int) -> Optional[OneTimePreKey]:
        return self._one_time_prekeys.get(device_id, {}).get(key_id)
        
    def get_available_one_time_prekeys(self, device_id: str) -> List[OneTimePreKey]:
        keys = self._one_time_prekeys.get(device_id, {}).values()
        return [k for k in keys if k.status == PreKeyStatus.ACTIVE]
