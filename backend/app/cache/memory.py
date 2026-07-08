from typing import Any, Optional, Dict
from datetime import datetime, timedelta
from .provider import CacheProvider
import threading

class MemoryCache(CacheProvider):
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            
            entry = self._cache[key]
            if entry["expires_at"] and datetime.utcnow() > entry["expires_at"]:
                del self._cache[key]
                return None
                
            return entry["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        with self._lock:
            expires_at = None
            if ttl is not None:
                expires_at = datetime.utcnow() + timedelta(seconds=ttl)
                
            self._cache[key] = {
                "value": value,
                "expires_at": expires_at
            }
            return True

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def exists(self, key: str) -> bool:
        with self._lock:
            if key not in self._cache:
                return False
                
            entry = self._cache[key]
            if entry["expires_at"] and datetime.utcnow() > entry["expires_at"]:
                del self._cache[key]
                return False
                
            return True

    def clear(self) -> bool:
        with self._lock:
            self._cache.clear()
            return True
