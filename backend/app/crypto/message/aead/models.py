from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import uuid
from app.crypto.double_ratchet.headers.models import MessageHeader

class EncryptedMessage(BaseModel):
    """
    Immutable representation of a fully encrypted SafeChat payload.
    Combines the visible Header, the AES Nonce, the Ciphertext, and the Authentication Tag.
    """
    message_uuid: str = Field(default_factory=lambda: uuid.uuid4().hex)
    header: MessageHeader
    
    # Cryptographic materials
    nonce: bytes
    ciphertext: bytes
    authentication_tag: bytes
    
    # Metadata
    protocol_version: str = "1.0"
    session_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        frozen = True # Enforce strict immutability

    def __repr__(self):
        return f"<EncryptedMessage session_id={self.session_id} message_uuid={self.message_uuid} [PAYLOAD ENCRYPTED]>"

class PlaintextMessage(BaseModel):
    """
    Immutable representation of a safely decrypted SafeChat payload.
    """
    session_id: str
    message_uuid: str
    plaintext: bytes
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        frozen = True

    def __repr__(self):
        return f"<PlaintextMessage session_id={self.session_id} message_uuid={self.message_uuid} [DECRYPTED PAYLOAD HIDDEN]>"
