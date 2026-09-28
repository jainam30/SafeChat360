import os
import secrets
import warnings
from pydantic_settings import BaseSettings

# A stable per-boot fallback keeps sessions working in development when no
# SECRET_KEY is configured (all previously issued tokens are invalidated on
# restart, which is acceptable for dev). Production MUST set SECRET_KEY.
_DEFAULT_DEV_SECRET = "dev-only-" + secrets.token_hex(32)

class SecuritySettings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_DEV_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRES_MINUTES: int = 1440
    # Never include "*" together with allow_credentials=True - browsers reject
    # that combination, and it is unsafe anyway. List real origins explicitly.
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        if "*" in origins:
            warnings.warn(
                'ALLOWED_ORIGINS contains "*" which is unsafe with credentials; '
                "it will be ignored. List explicit origins instead.",
                stacklevel=1,
            )
