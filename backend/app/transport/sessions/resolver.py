import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class SessionResolver:
    """
    Maps an ephemeral network connection (e.g. WebSocket ID) to a persistent SecureSession ID.
    This prevents the transport layer from needing to track cryptographic state.
    """
    
    def __init__(self):
        # connection_id -> session_id
        self._c2s: Dict[str, str] = {}
        # session_id -> list of connection_ids (support multiple devices/tabs)
        self._s2c: Dict[str, list[str]] = {}
        
    def link(self, connection_id: str, session_id: str):
        self._c2s[connection_id] = session_id
        
        if session_id not in self._s2c:
            self._s2c[session_id] = []
        if connection_id not in self._s2c[session_id]:
            self._s2c[session_id].append(connection_id)
            
        logger.info(f"Linked Connection {connection_id} <-> Session {session_id}")

    def unlink_connection(self, connection_id: str):
        session_id = self._c2s.pop(connection_id, None)
        if session_id and session_id in self._s2c:
            self._s2c[session_id].remove(connection_id)
            if not self._s2c[session_id]:
                del self._s2c[session_id]
        logger.debug(f"Unlinked Connection {connection_id}")

    def resolve_session(self, connection_id: str) -> Optional[str]:
        return self._c2s.get(connection_id)
        
    def resolve_connections(self, session_id: str) -> list[str]:
        return self._s2c.get(session_id, [])
