import logging
from app.delivery.tracking.delivery_tracker import DeliveryTracker
from app.delivery.state.delivery_state_machine import MessageState
from app.offline.queue.queue_manager import OfflineQueueManager

logger = logging.getLogger(__name__)

class SessionRecoveryManager:
    """
    Bridges F6.3 (Delivery Engine) and F6.4 (Offline Queue).
    When a message hits FAILED in the Delivery Engine, it moves here.
    """
    
    def __init__(self, tracker: DeliveryTracker, queue_manager: OfflineQueueManager):
        self.tracker = tracker
        self.queue_manager = queue_manager
        
    def transition_failed_to_offline(self, message_uuid: str, recipient_id: str) -> bool:
        """
        Moves a FAILED message from active memory tracking into the persistent offline queue.
        """
        tracked = self.tracker.get(message_uuid)
        
        if not tracked:
            logger.error(f"Cannot move {message_uuid} to offline queue: Not found in tracker.")
            return False
            
        if tracked.state != MessageState.FAILED:
            logger.error(f"Cannot move {message_uuid} to offline queue: Not in FAILED state (current={tracked.state.value}).")
            return False
            
        # Move to persistent offline queue
        success = self.queue_manager.enqueue_message(recipient_id, tracked.encrypted_payload)
        
        if success:
            # Safely stop tracking in active memory now that it's persisted
            self.tracker.remove(message_uuid)
            logger.info(f"Successfully migrated {message_uuid} to Offline Queue.")
            return True
            
        return False
