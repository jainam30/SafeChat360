import os
from pydantic_settings import BaseSettings

class NotificationSettings(BaseSettings):
    NOTIFICATION_PROVIDERS: str = os.getenv("NOTIFICATION_PROVIDERS", "inapp")
