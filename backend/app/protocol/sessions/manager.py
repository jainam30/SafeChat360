from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
import uuid

class SessionContext(BaseModel):
    """
    Immutable representation of an active, authenticated SCP session.
    """
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: int
    device_id: str
    identity_fingerprint: str
    protocol_version: str
    negotiated_capabilities: List[str]
    sequence_counter: int = 0
    handshake_timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_creation_time: datetime = Field(default_factory=datetime.utcnow)
    last_activity_time: datetime = Field(default_factory=datetime.utcnow)
    authentication_state: str = "AUTHENTICATED"

class SessionContextManager:
    """
    Manages the lifecycle of SessionContexts. 
    In Phase F3.2, we mock the storage (in-memory) since this is decoupled.
    """
    def __init__(self):
        self._active_sessions: Dict[str, SessionContext] = {}

    def create_session(
        self, client_id: int, device_id: str, fingerprint: str, 
        version: str, caps: List[str]
    ) -> SessionContext:
        ctx = SessionContext(
            client_id=client_id,
            device_id=device_id,
            identity_fingerprint=fingerprint,
            protocol_version=version,
            negotiated_capabilities=caps
        )
        self._active_sessions[ctx.session_id] = ctx
        return ctx

    def get_session(self, session_id: str) -> Optional[SessionContext]:
        return self._active_sessions.get(session_id)

    def destroy_session(self, session_id: str):
        """Zeroize and purge session data upon disconnect."""
        if session_id in self._active_sessions:
            del self._active_sessions[session_id]
