from enum import Enum
import logging

logger = logging.getLogger(__name__)

class ProtocolState(str, Enum):
    DISCONNECTED = "Disconnected"
    CONNECTING = "Connecting"
    NEGOTIATING = "Negotiating"
    VERIFYING_IDENTITY = "VerifyingIdentity"
    CHALLENGE = "Challenge"
    AUTHENTICATED = "Authenticated"
    READY = "Ready"
    SESSION_PENDING = "SessionPending"
    SESSION_ESTABLISHED = "SessionEstablished"
    MESSAGING = "Messaging"
    CLOSING = "Closing"
    CLOSED = "Closed"

# Valid transitions
TRANSITIONS = {
    ProtocolState.DISCONNECTED: [ProtocolState.CONNECTING],
    ProtocolState.CONNECTING: [ProtocolState.NEGOTIATING, ProtocolState.CLOSED],
    ProtocolState.NEGOTIATING: [ProtocolState.VERIFYING_IDENTITY, ProtocolState.CLOSED],
    ProtocolState.VERIFYING_IDENTITY: [ProtocolState.CHALLENGE, ProtocolState.CLOSED],
    ProtocolState.CHALLENGE: [ProtocolState.AUTHENTICATED, ProtocolState.CLOSED],
    ProtocolState.AUTHENTICATED: [ProtocolState.READY, ProtocolState.CLOSING],
    ProtocolState.READY: [ProtocolState.SESSION_PENDING, ProtocolState.CLOSING],
    ProtocolState.SESSION_PENDING: [ProtocolState.SESSION_ESTABLISHED, ProtocolState.CLOSING],
    ProtocolState.SESSION_ESTABLISHED: [ProtocolState.MESSAGING, ProtocolState.CLOSING],
    ProtocolState.MESSAGING: [ProtocolState.CLOSING],
    ProtocolState.CLOSING: [ProtocolState.CLOSED],
    ProtocolState.CLOSED: [ProtocolState.CONNECTING] # Reconnection
}

class SCPStateMachine:
    def __init__(self):
        self.state = ProtocolState.DISCONNECTED

    def transition(self, next_state: ProtocolState) -> ProtocolState:
        allowed = TRANSITIONS.get(self.state, [])
        if next_state not in allowed:
            # Special case: always allow transition to CLOSED from anywhere
            if next_state == ProtocolState.CLOSED:
                self.state = next_state
                return self.state
                
            raise ValueError(f"Illegal transition: {self.state} -> {next_state}")
            
        logger.debug(f"Protocol transition: {self.state} -> {next_state}")
        self.state = next_state
        return self.state
