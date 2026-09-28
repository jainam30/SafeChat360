import os
from typing import Dict, Optional, List
from .models import HandshakeContext, SessionState
from .exceptions import SessionExistsError

class SessionRepository:
    def __init__(self):
        # Maps handshake_id -> HandshakeContext
        self._handshakes: Dict[str, HandshakeContext] = {}
        # Maps (local_device, remote_device) -> SessionState
        self._sessions: Dict[str, SessionState] = {}
        self._consumed_prekeys: set = set()

    def save_handshake(self, context: HandshakeContext):
        self._handshakes[context.handshake_id] = context

    def get_handshake(self, handshake_id: str) -> Optional[HandshakeContext]:
        return self._handshakes.get(handshake_id)

    def mark_prekey_consumed(self, prekey_id: str) -> bool:
        if prekey_id in self._consumed_prekeys:
            return False
        self._consumed_prekeys.add(prekey_id)
        return True

    def save_session(self, session: SessionState):
        key = f"{session.local_device_id}:{session.remote_device_id}"
        if key in self._sessions:
            raise SessionExistsError(f"Active session already exists for {key}")
        self._sessions[key] = session

    def get_active_session(self, local: str, remote: str) -> Optional[SessionState]:
        key = f"{local}:{remote}"
        return self._sessions.get(key)
        
    def replace_session(self, session: SessionState):
        key = f"{session.local_device_id}:{session.remote_device_id}"
        self._sessions[key] = session
        
    def remove_session(self, local: str, remote: str):
        key = f"{local}:{remote}"
        if key in self._sessions:
            del self._sessions[key]
