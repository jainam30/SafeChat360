import logging
from app.delivery.ack.ack_models import AckPacket
from app.delivery.tracking.delivery_tracker import DeliveryTracker
from app.delivery.state.delivery_state_machine import MessageState

logger = logging.getLogger(__name__)

class AckManager:
    """
    Processes incoming ACK packets from the transport layer and resolves message state.
    """
    
    def __init__(self, tracker: DeliveryTracker):
        self.tracker = tracker
        
    def process_ack(self, ack_packet: AckPacket) -> bool:
        """
        Validates the ACK and updates the tracking database.
        Returns True if successful, False if the ACK was rejected.
        """
        uuid = ack_packet.message_uuid
        tracked = self.tracker.get(uuid)
        
        if not tracked:
            logger.warning(f"ACK Rejected: Message UUID {uuid} is unknown or already resolved.")
            return False
            
        if tracked.session_id != ack_packet.session_id:
            logger.error(f"ACK Rejected: Session spoofing attempt for {uuid}.")
            return False
            
        if tracked.state == MessageState.DELIVERED:
            logger.warning(f"ACK Rejected: Duplicate ACK for {uuid}.")
            return False
            
        # Transition to DELIVERED
        self.tracker.transition_state(uuid, MessageState.DELIVERED)
        logger.info(f"ACK Accepted: Message {uuid} successfully delivered.")
        return True
