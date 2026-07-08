from enum import Enum
import logging

logger = logging.getLogger(__name__)

class MessageState(Enum):
    CREATED = "CREATED"       # Object created in memory
    ENCRYPTED = "ENCRYPTED"   # Safely passed through SecureMessagingService
    QUEUED = "QUEUED"         # In local queue waiting for transport (F6.4)
    SENT = "SENT"             # Flushed to WebSocket
    DELIVERED = "DELIVERED"   # Target client acknowledged receipt
    FAILED = "FAILED"         # Max retries exceeded or fatal error

class DeliveryStateMachine:
    """
    Enforces deterministic state transitions for outbound messages.
    """
    
    VALID_TRANSITIONS = {
        MessageState.CREATED: [MessageState.ENCRYPTED, MessageState.FAILED],
        MessageState.ENCRYPTED: [MessageState.QUEUED, MessageState.FAILED],
        MessageState.QUEUED: [MessageState.SENT, MessageState.FAILED],
        MessageState.SENT: [MessageState.DELIVERED, MessageState.FAILED],
        MessageState.DELIVERED: [], # Terminal (Read state is future scope)
        MessageState.FAILED: []     # Terminal
    }
    
    @classmethod
    def transition(cls, current_state: MessageState, target_state: MessageState, message_uuid: str) -> MessageState:
        if target_state in cls.VALID_TRANSITIONS.get(current_state, []):
            logger.debug(f"Message {message_uuid} transitioned: {current_state.value} -> {target_state.value}")
            return target_state
        else:
            logger.error(f"Invalid state transition for {message_uuid}: {current_state.value} -> {target_state.value}")
            raise ValueError(f"Cannot transition from {current_state.value} to {target_state.value}")
