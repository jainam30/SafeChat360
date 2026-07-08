from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OutboundMessage(BaseModel):
    """
    Represents a plaintext message request originating from the business logic,
    intended to be encrypted and sent to a remote recipient.
    """
    recipient_id: str
    plaintext_payload: str
    session_id: Optional[str] = None # Can be omitted if the service needs to look it up
    
    class Config:
        frozen = True

class InboundMessage(BaseModel):
    """
    Represents a safely decrypted message delivered from the SecureMessagingService
    up to the business logic layer.
    """
    sender_id: str
    session_id: str
    plaintext_payload: str
    decrypted_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        frozen = True
