import logging
from app.messaging.models.messages import OutboundMessage

logger = logging.getLogger(__name__)

class MessageValidator:
    """
    Validates messages at the edge before they touch the cryptography layer.
    """
    
    # 256 KB max payload size to prevent cipher/memory exhaustion
    MAX_PAYLOAD_BYTES = 256 * 1024 
    
    @classmethod
    def validate_outbound(cls, message: OutboundMessage) -> bool:
        if not message.recipient_id:
            logger.error("Message rejected: Missing recipient_id.")
            return False
            
        if not message.plaintext_payload:
            logger.error("Message rejected: Empty payload.")
            return False
            
        payload_size = len(message.plaintext_payload.encode('utf-8'))
        if payload_size > cls.MAX_PAYLOAD_BYTES:
            logger.error(f"Message rejected: Payload size ({payload_size} bytes) exceeds {cls.MAX_PAYLOAD_BYTES} bytes.")
            return False
            
        return True
