from typing import Dict, List, Optional
from datetime import datetime
import asyncio
from ..models.keys import SignedPrekey, OneTimePrekey
from ..models.bundle import PrekeyBundle

class PrekeyRepository:
    """
    Abstract storage for the X3DH ecosystem.
    Currently mocked in-memory to prevent DB schema migrations during Phase F4.1.
    """
    def __init__(self):
        # Maps user_id -> device_id -> List[SignedPrekey]
        self._signed_prekeys: Dict[int, Dict[str, List[SignedPrekey]]] = {}
        # Maps user_id -> device_id -> List[OneTimePrekey]
        self._one_time_prekeys: Dict[int, Dict[str, List[OneTimePrekey]]] = {}
        # Maps user_id -> device_id -> bundle
        self._bundles: Dict[int, Dict[str, PrekeyBundle]] = {}
        
        # Lock to defend against concurrent consumption races
        self._lock = asyncio.Lock()

    async def insert_signed_prekey(self, user_id: int, device_id: str, key: SignedPrekey):
        async with self._lock:
            if user_id not in self._signed_prekeys:
                self._signed_prekeys[user_id] = {}
            if device_id not in self._signed_prekeys[user_id]:
                self._signed_prekeys[user_id][device_id] = []
            
            # Retire the currently active ones
            for existing in self._signed_prekeys[user_id][device_id]:
                if existing.status == "ACTIVE":
                    existing.status = "RETIRED"
            
            self._signed_prekeys[user_id][device_id].append(key)

    async def get_active_signed_prekey(self, user_id: int, device_id: str) -> Optional[SignedPrekey]:
        async with self._lock:
            keys = self._signed_prekeys.get(user_id, {}).get(device_id, [])
            for k in keys:
                if k.status == "ACTIVE":
                    return k
            return None

    async def insert_one_time_prekeys(self, user_id: int, device_id: str, keys: List[OneTimePrekey]):
        async with self._lock:
            if user_id not in self._one_time_prekeys:
                self._one_time_prekeys[user_id] = {}
            if device_id not in self._one_time_prekeys[user_id]:
                self._one_time_prekeys[user_id][device_id] = []
            
            self._one_time_prekeys[user_id][device_id].extend(keys)

    async def consume_one_time_prekey(self, user_id: int, device_id: str, key_id: int) -> bool:
        """
        Atomically consumes a One-Time Prekey. Returns True if successful, False if already consumed or missing.
        """
        async with self._lock:
            keys = self._one_time_prekeys.get(user_id, {}).get(device_id, [])
            for k in keys:
                if k.key_id == key_id:
                    if k.status == "AVAILABLE":
                        k.status = "CONSUMED"
                        k.consumed_at = datetime.utcnow()
                        return True
                    return False
            return False

    async def get_available_opk_count(self, user_id: int, device_id: str) -> int:
        async with self._lock:
            keys = self._one_time_prekeys.get(user_id, {}).get(device_id, [])
            return sum(1 for k in keys if k.status == "AVAILABLE")

    async def get_any_available_opk(self, user_id: int, device_id: str) -> Optional[OneTimePrekey]:
        async with self._lock:
            keys = self._one_time_prekeys.get(user_id, {}).get(device_id, [])
            for k in keys:
                if k.status == "AVAILABLE":
                    return k
            return None

    async def store_bundle(self, user_id: int, device_id: str, bundle: PrekeyBundle):
        async with self._lock:
            if user_id not in self._bundles:
                self._bundles[user_id] = {}
            self._bundles[user_id][device_id] = bundle

    async def get_bundle(self, user_id: int, device_id: str) -> Optional[PrekeyBundle]:
        async with self._lock:
            return self._bundles.get(user_id, {}).get(device_id)
