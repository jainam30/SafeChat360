import logging
import asyncio
from typing import Callable, Awaitable
from app.offline.queue.queue_manager import OfflineQueueManager
from app.crypto.message.aead.models import EncryptedMessage

logger = logging.getLogger(__name__)

class DeliveryScheduler:
    """
    Orchestrates the flushing of the offline queue when a user comes online.
    """
    
    def __init__(self, queue_manager: OfflineQueueManager, transport_sender: Callable[[str, EncryptedMessage], Awaitable[None]]):
        self.queue_manager = queue_manager
        self.transport_sender = transport_sender
        
    async def flush_queue_for_user(self, recipient_id: str, session_id: str) -> None:
        """
        Retrieves all pending messages for the user and transmits them.
        """
        pending_messages = self.queue_manager.get_pending_messages(recipient_id)
        if not pending_messages:
            logger.debug(f"No pending offline messages for {recipient_id}")
            return
            
        logger.info(f"Flushing {len(pending_messages)} offline messages for {recipient_id}")
        
        for msg in pending_messages:
            try:
                # We resend the exact encrypted payload. No crypto is performed.
                # In F6.2, transport_sender expects (session_id, EncryptedMessage)
                await self.transport_sender(session_id, msg)
                # Note: The ACK engine (F6.3) handles the actual transition out of the queue.
            except Exception as e:
                logger.error(f"Failed to transmit queued message {msg.message_uuid}: {e}")
