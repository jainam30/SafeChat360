import logging
from typing import Dict, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.crypto.message.aead.models import EncryptedMessage
from app.delivery.state.delivery_state_machine import MessageState, DeliveryStateMachine

logger = logging.getLogger(__name__)

class TrackedMessage(BaseModel):
    message_uuid: str
    session_id: str
    state: MessageState
    encrypted_payload: EncryptedMessage
    retry_count: int = 0
    last_attempt: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    failure_reason: Optional[str] = None

class DeliveryTracker:
    """
    In-Memory repository tracking the exact status of all outbound messages.
    """
    
    def __init__(self):
        self._store: Dict[str, TrackedMessage] = {}
        
    def track_new(self, encrypted_msg: EncryptedMessage) -> TrackedMessage:
        uuid = encrypted_msg.message_uuid
        if uuid in self._store:
            logger.warning(f"Message {uuid} is already being tracked.")
            return self._store[uuid]
            
        tracked = TrackedMessage(
            message_uuid=uuid,
            session_id=encrypted_msg.session_id,
            state=MessageState.ENCRYPTED,
            encrypted_payload=encrypted_msg
        )
        self._store[uuid] = tracked
        return tracked

    def get(self, message_uuid: str) -> Optional[TrackedMessage]:
        return self._store.get(message_uuid)
        
    def get_pending_messages(self) -> List[TrackedMessage]:
        """Returns messages that have been SENT but not DELIVERED."""
        return [msg for msg in self._store.values() if msg.state == MessageState.SENT]

    def transition_state(self, message_uuid: str, new_state: MessageState, reason: str = None) -> Optional[TrackedMessage]:
        tracked = self.get(message_uuid)
        if not tracked:
            logger.error(f"Cannot transition unknown message {message_uuid}")
            return None
            
        try:
            tracked.state = DeliveryStateMachine.transition(tracked.state, new_state, message_uuid)
            if reason:
                tracked.failure_reason = reason
            return tracked
        except ValueError as e:
            logger.error(str(e))
            return None

    def record_attempt(self, message_uuid: str) -> None:
        tracked = self.get(message_uuid)
        if tracked:
            tracked.retry_count += 1
            tracked.last_attempt = datetime.utcnow()
            
    def remove(self, message_uuid: str) -> None:
        if message_uuid in self._store:
            del self._store[message_uuid]
