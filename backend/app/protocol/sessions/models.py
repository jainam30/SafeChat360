from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class SCPSession(BaseModel):
    session_id: str
    protocol_version: str
    capabilities: List[str]
    peer_identity_id: str
    peer_device_id: str
    transport: str = "WebSocket"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    verification_status: str = "UNVERIFIED"

    # Cryptographic keys are NOT stored here. 
    # This just tracks the protocol semantics of the active pipe.
