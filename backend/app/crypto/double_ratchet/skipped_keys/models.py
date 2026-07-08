from pydantic import BaseModel, Field
from datetime import datetime

class SkippedKeyRecord(BaseModel):
    """
    Immutable representation of a skipped Message Key.
    """
    session_id: str
    ratchet_public_key: str
    message_number: int
    message_key: bytes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        frozen = True

    def __repr__(self):
        return f"<SkippedKeyRecord session_id={self.session_id} message_number={self.message_number} [KEY HIDDEN]>"
