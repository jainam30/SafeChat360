import os
from pydantic_settings import BaseSettings

class FirebaseSettings(BaseSettings):
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
