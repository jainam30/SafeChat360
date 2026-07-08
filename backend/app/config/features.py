import os
from pydantic_settings import BaseSettings

class FeatureSettings(BaseSettings):
    FEATURES_ENABLED: str = os.getenv("FEATURES_ENABLED", "voice_calls,ai_assistant")
