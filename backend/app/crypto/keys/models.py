from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class KeyModel(BaseModel):
    key_id: str
    algorithm: str
    created_at: datetime
    public_bytes: bytes

class IdentityKey(KeyModel):
    """Long-term identity key for a user/device."""
    pass

class SignedPreKey(KeyModel):
    """Medium-term signed prekey."""
    signature: bytes

class OneTimePreKey(KeyModel):
    """Single-use prekey."""
    pass

class SessionKey(BaseModel):
    """Symmetric key representing a negotiated session."""
    session_id: str
    shared_secret: bytes # In practice, this would not be stored in plaintext
    established_at: datetime

class MessageKey(BaseModel):
    """Symmetric key for a specific message (derived from session)."""
    message_id: str
    key_material: bytes
    nonce: bytes

class MediaKey(BaseModel):
    """Symmetric key for an attachment."""
    media_id: str
    key_material: bytes
    iv: bytes
