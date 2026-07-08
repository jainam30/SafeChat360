import logging
from typing import Dict, Optional
from .secure_session import SecureSession
from app.crypto.double_ratchet.models.state import DoubleRatchetState

logger = logging.getLogger(__name__)

class SessionManager:
    """
    Manages active SecureSessions in memory.
    Mocks database retrieval for Phase F6.1.
    """
    
    def __init__(self):
        self._active_sessions: Dict[str, SecureSession] = {}
        
    def load_session(self, session_id: str) -> Optional[SecureSession]:
        return self._active_sessions.get(session_id)
        
    def create_and_store_session(self, state: DoubleRatchetState, device_id: str) -> SecureSession:
        if state.session_id in self._active_sessions:
            logger.warning(f"Session {state.session_id} already exists. Overwriting.")
            
        session = SecureSession(state, device_id)
        self._active_sessions[state.session_id] = session
        logger.info(f"SecureSession created and stored for {state.session_id}")
        return session

    def remove_session(self, session_id: str) -> None:
        if session_id in self._active_sessions:
            session = self._active_sessions.pop(session_id)
            session.destroy()
            logger.info(f"SecureSession {session_id} removed from manager.")
