from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class PrekeyBundle(BaseModel):
    bundle_id: str
    protocol_version: str = "X3DH/1.0"
    device_id: str
    identity_public_key_b64: str
    
    # Signed Prekey
    signed_prekey_id: int
    signed_prekey_public_b64: str
    signed_prekey_signature_b64: str
    
    # One-Time Prekey
    one_time_prekey_id: int
    one_time_prekey_public_b64: str
    
    capabilities: List[str]
    generated_at: datetime = Field(default_factory=datetime.utcnow)
