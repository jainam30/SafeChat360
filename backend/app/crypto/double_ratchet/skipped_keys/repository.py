import threading
import logging
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
from .models import SkippedKeyRecord
from .interfaces import ISkippedKeyStore

logger = logging.getLogger(__name__)

class InMemorySkippedKeyStore(ISkippedKeyStore):
    """
    In-Memory implementation of the Skipped Key Store for Phase F5.7 scope.
    Guarantees exactly-once consumption using thread locks.
    """
    
    def __init__(self, max_keys: int = 2000):
        self._store: Dict[Tuple[str, str, int], SkippedKeyRecord] = {}
        self._lock = threading.Lock()
        self._max_keys = max_keys

    def store(self, record: SkippedKeyRecord) -> None:
        key = (record.session_id, record.ratchet_public_key, record.message_number)
        
        with self._lock:
            if len(self._store) >= self._max_keys:
                logger.warning("Skipped Key Store reached max capacity. Dropping new key.")
                return # In production, might evict oldest instead
                
            self._store[key] = record
            logger.debug(f"Stored skipped key for session {record.session_id}, msg={record.message_number}")

    def consume(self, session_id: str, ratchet_public_key: str, message_number: int) -> Optional[bytes]:
        key = (session_id, ratchet_public_key, message_number)
        
        with self._lock:
            if key in self._store:
                record = self._store.pop(key)
                logger.info(f"Consumed skipped key for session {session_id}, msg={message_number}")
                return record.message_key
                
        return None

    def count(self) -> int:
        with self._lock:
            return len(self._store)

    def cleanup_expired(self, max_age_seconds: int = 604800) -> int: # 7 days
        cutoff = datetime.utcnow() - timedelta(seconds=max_age_seconds)
        expired_count = 0
        
        with self._lock:
            # We must iterate over a list of keys to safely modify the dict
            for key in list(self._store.keys()):
                if self._store[key].created_at < cutoff:
                    del self._store[key]
                    expired_count += 1
                    
        if expired_count > 0:
            logger.info(f"Cleaned up {expired_count} expired skipped keys.")
            
        return expired_count
