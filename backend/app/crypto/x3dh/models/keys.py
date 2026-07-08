from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SignedPrekey(BaseModel):
    key_id: int
    public_key_b64: str
    signature_b64: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    status: str = "ACTIVE" # ACTIVE, RETIRED, EXPIRED

class OneTimePrekey(BaseModel):
    key_id: int
    public_key_b64: str
    status: str = "AVAILABLE" # AVAILABLE, CONSUMED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    consumed_at: Optional[datetime] = None
