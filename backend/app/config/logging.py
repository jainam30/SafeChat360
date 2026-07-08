import os
from pydantic_settings import BaseSettings

class LoggingSettings(BaseSettings):
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    AUDIT_LOG_FORMAT: str = "json"
