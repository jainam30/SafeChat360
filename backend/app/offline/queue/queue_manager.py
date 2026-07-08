import logging
from datetime import datetime, timedelta
from typing import List
from .queue_repository import OfflineQueueRepository, QueuedMessage
from app.crypto.message.aead.models import EncryptedMessage

logger = logging.getLogger(__name__)

class OfflineQueueManager:
    """
    Enforces business policies (retention, size limits) over the QueueRepository.
    """
    
    def __init__(self, repository: OfflineQueueRepository, max_retention_days: int = 30, max_queue_size: int = 1000):
        self.repository = repository
        self.max_retention_days = max_retention_days
        self.max_queue_size = max_queue_size
        
    def enqueue_message(self, recipient_id: str, payload: EncryptedMessage) -> bool:
        """
        Attempts to queue a message. Returns False if queue limits are exceeded.
        """
        current_queue = self.repository.get_messages(recipient_id)
        
        # 1. Enforce Max Queue Size
        if len(current_queue) >= self.max_queue_size:
            logger.error(f"Cannot enqueue message for {recipient_id}: Max queue size ({self.max_queue_size}) exceeded.")
            return False
            
        # 2. Duplicate Suppression
        for msg in current_queue:
            if msg.encrypted_payload.message_uuid == payload.message_uuid:
                logger.warning(f"Ignoring duplicate enqueue request for {payload.message_uuid}")
                return True
                
        self.repository.enqueue(recipient_id, payload)
        logger.info(f"Successfully enqueued message {payload.message_uuid} for {recipient_id}")
        return True

    def get_pending_messages(self, recipient_id: str) -> List[EncryptedMessage]:
        """
        Retrieves pending messages, filtering out expired ones.
        """
        cutoff = datetime.utcnow() - timedelta(days=self.max_retention_days)
        valid_messages = []
        
        for msg in self.repository.get_messages(recipient_id):
            if msg.queued_at < cutoff:
                logger.info(f"Offline message {msg.encrypted_payload.message_uuid} expired.")
                self.repository.remove_message(recipient_id, msg.encrypted_payload.message_uuid)
            else:
                valid_messages.append(msg.encrypted_payload)
                
        return valid_messages
        
    def acknowledge_delivery(self, recipient_id: str, message_uuid: str) -> None:
        """
        Removes the message from the offline queue once it is finally delivered.
        """
        self.repository.remove_message(recipient_id, message_uuid)
