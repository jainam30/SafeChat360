import os
from pydantic_settings import BaseSettings

class StorageSettings(BaseSettings):
    MAX_UPLOAD_SIZE_MB: int = 5
    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "supabase")
