from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PreKeyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RESERVED = "RESERVED"
    CONSUMED = "CONSUMED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"

class BasePreKey(BaseModel):
    key_id: int
    algorithm: str = "X25519"
    version: str = "1.0"
    device_id: str
    user_id: str
    public_key_bytes: bytes # Represents the public key (base64 encoded or raw bytes, storing as bytes)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    fingerprint: str
    
class IdentityPublicKey(BasePreKey):
    """Long-term identity key."""
    status: PreKeyStatus = PreKeyStatus.ACTIVE

class SignedPreKey(BasePreKey):
    """Medium-term signed pre-key, rotated periodically."""
    signature: bytes
    status: PreKeyStatus = PreKeyStatus.ACTIVE
    expiration_time: datetime

class OneTimePreKey(BasePreKey):
    """Single-use pre-key for forward secrecy."""
    status: PreKeyStatus = PreKeyStatus.ACTIVE
    reserved_until: Optional[datetime] = None
