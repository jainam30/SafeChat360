from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from .state_machine import HandshakeState, SessionStatus

class HandshakeContext(BaseModel):
    handshake_id: str
    protocol_version: str
    initiator_device: str
    recipient_device: str
    identity_key_id: str
    signed_prekey_id: str
    onetime_prekey_id: Optional[str] = None
    reservation_id: Optional[str] = None
    state: HandshakeState = HandshakeState.INITIALIZED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_info: Optional[str] = None
    correlation_id: str

class SessionState(BaseModel):
    session_id: str
    local_device_id: str
    remote_device_id: str
    protocol_version: str
    handshake_timestamp: datetime
    verification_status: str
    handshake_metadata: Dict[str, Any]
    status: SessionStatus = SessionStatus.PENDING
    expiration_time: Optional[datetime] = None
    ratchet_placeholder: str = "reserved_for_f4"
    root_secret_metadata_ref: str
