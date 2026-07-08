from .database import DatabaseSettings
from .security import SecuritySettings
from .storage import StorageSettings
from .firebase import FirebaseSettings
from .logging import LoggingSettings
from .cache import CacheSettings
from .notifications import NotificationSettings
from .features import FeatureSettings

class Settings(
    DatabaseSettings,
    SecuritySettings,
    StorageSettings,
    FirebaseSettings,
    LoggingSettings,
    CacheSettings,
    NotificationSettings,
    FeatureSettings
):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
