from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class DoubleRatchetState(BaseModel):
    """
    Immutable representation of the cryptographic state of a session.
    """
    session_id: str
    
    # 32-byte master chain keys
    root_key: bytes
    sending_chain_key: Optional[bytes] = None
    receiving_chain_key: Optional[bytes] = None
    
    # Diffie-Hellman Ratchet state
    current_dh_public_key: Optional[str] = None
    current_dh_private_key: Optional[str] = None
    remote_dh_public_key: Optional[str] = None
    
    # Message Sequence Counters
    sending_message_number: int = 0
    receiving_message_number: int = 0
    previous_chain_length: int = 0
    
    # Metadata
    protocol_version: str
    capabilities: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    state_version: int = 1

    class Config:
        arbitrary_types_allowed = True

    def __repr__(self):
        return f"<DoubleRatchetState session_id={self.session_id} [CRYPTO STATE HIDDEN]>"
