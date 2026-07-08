from typing import Any, Optional
from .provider import CacheProvider

class CacheService:
    def __init__(self, provider: CacheProvider):
        self.provider = provider

    def get(self, key: str) -> Optional[Any]:
        return self.provider.get(key)

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        return self.provider.set(key, value, ttl)

    def delete(self, key: str) -> bool:
        return self.provider.delete(key)

    def exists(self, key: str) -> bool:
        return self.provider.exists(key)

    def clear(self) -> bool:
        return self.provider.clear()
