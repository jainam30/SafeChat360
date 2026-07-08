import logging
import asyncio
from datetime import datetime, timedelta
from app.delivery.tracking.delivery_tracker import DeliveryTracker
from app.delivery.state.delivery_state_machine import MessageState
from typing import Callable, Awaitable
from app.crypto.message.aead.models import EncryptedMessage

logger = logging.getLogger(__name__)

class RetryScheduler:
    """
    Asynchronous background task that monitors the DeliveryTracker for messages
    stuck in the SENT state and re-transmits them using exponential backoff.
    """
    
    # Exponential backoff schedule (seconds)
    BACKOFF_SCHEDULE = [3, 6, 12]
    
    def __init__(self, tracker: DeliveryTracker, transport_sender: Callable[[str, EncryptedMessage], Awaitable[None]]):
        self.tracker = tracker
        self.transport_sender = transport_sender
        self._running = False

    async def start(self):
        self._running = True
        logger.info("RetryScheduler started.")
        while self._running:
            await self._scan_and_retry()
            await asyncio.sleep(1) # Check every second
            
    def stop(self):
        self._running = False
        logger.info("RetryScheduler stopped.")

    async def _scan_and_retry(self):
        now = datetime.utcnow()
        pending = self.tracker.get_pending_messages()
        
        for msg in pending:
            retry_count = msg.retry_count
            
            if retry_count >= len(self.BACKOFF_SCHEDULE):
                # Max retries exceeded
                logger.error(f"Message {msg.message_uuid} exceeded max retries. Marking FAILED.")
                self.tracker.transition_state(msg.message_uuid, MessageState.FAILED, reason="Max retries exceeded")
                continue
                
            timeout_seconds = self.BACKOFF_SCHEDULE[retry_count]
            time_since_last = (now - (msg.last_attempt or msg.created_at)).total_seconds()
            
            if time_since_last >= timeout_seconds:
                # Trigger retry
                logger.info(f"Retrying message {msg.message_uuid} (Attempt {retry_count + 1})")
                self.tracker.record_attempt(msg.message_uuid)
                
                try:
                    # CRITICAL: We only resend the immutable EncryptedMessage.
                    # We NEVER call the crypto engine during a retry.
                    await self.transport_sender(msg.session_id, msg.encrypted_payload)
                except Exception as e:
                    logger.error(f"Transport failure during retry for {msg.message_uuid}: {e}")
