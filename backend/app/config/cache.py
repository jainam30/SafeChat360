import os
from pydantic_settings import BaseSettings

class CacheSettings(BaseSettings):
    CACHE_PROVIDER: str = os.getenv("CACHE_PROVIDER", "memory")
    CACHE_DEFAULT_TTL: int = 3600
