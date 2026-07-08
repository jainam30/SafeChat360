from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class MessageHeader(BaseModel):
    """
    Immutable representation of the metadata accompanying a Double Ratchet encrypted payload.
    """
    header_uuid: str # UUIDv7 simulated
    protocol_version: str
    session_id: str
    sender_device_id: str
    
    ratchet_public_key: str
    previous_chain_length: int
    message_number: int
    
    header_version: int = 1
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    capabilities: List[str] = Field(default_factory=list)
    reserved_extension_fields: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        frozen = True # Enforce immutability
