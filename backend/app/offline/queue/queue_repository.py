import logging
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.crypto.message.aead.models import EncryptedMessage

logger = logging.getLogger(__name__)

class QueuedMessage(BaseModel):
    recipient_id: str
    encrypted_payload: EncryptedMessage
    queued_at: datetime = Field(default_factory=datetime.utcnow)

class OfflineQueueRepository:
    """
    Mock repository for persisting Offline Messages.
    In production, this would be a Postgres table or Redis sorted set.
    """
    
    def __init__(self):
        # Maps recipient_id -> list of QueuedMessages
        self._store: Dict[str, List[QueuedMessage]] = {}
        
    def enqueue(self, recipient_id: str, payload: EncryptedMessage) -> None:
        if recipient_id not in self._store:
            self._store[recipient_id] = []
            
        msg = QueuedMessage(recipient_id=recipient_id, encrypted_payload=payload)
        self._store[recipient_id].append(msg)
        logger.debug(f"Enqueued offline message {payload.message_uuid} for {recipient_id}")
        
    def get_messages(self, recipient_id: str) -> List[QueuedMessage]:
        return self._store.get(recipient_id, [])
        
    def remove_message(self, recipient_id: str, message_uuid: str) -> None:
        if recipient_id in self._store:
            initial_len = len(self._store[recipient_id])
            self._store[recipient_id] = [
                m for m in self._store[recipient_id] 
                if m.encrypted_payload.message_uuid != message_uuid
            ]
            if len(self._store[recipient_id]) < initial_len:
                logger.debug(f"Removed message {message_uuid} from offline queue for {recipient_id}")
