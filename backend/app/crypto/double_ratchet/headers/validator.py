import logging
from datetime import datetime, timedelta
from .models import MessageHeader
from .interfaces import IHeaderValidator

logger = logging.getLogger(__name__)

class HeaderValidator(IHeaderValidator):
    """
    Rigidly validates incoming MessageHeaders.
    """
    
    def validate(self, header: MessageHeader) -> bool:
        try:
            if not header.session_id or not header.ratchet_public_key:
                logger.error("Header missing mandatory fields")
                return False
                
            if header.message_number < 0 or header.previous_chain_length < 0:
                logger.error("Header contains negative counters")
                return False
                
            if header.protocol_version not in ["1.0", "X3DH/1.0", "DR/1.0"]:
                logger.error(f"Invalid protocol version: {header.protocol_version}")
                return False
                
            # Timestamp anomaly detection (e.g., > 1 hour in the future)
            # This prevents certain types of replay/confusion attacks
            future_threshold = datetime.utcnow() + timedelta(hours=1)
            if header.timestamp > future_threshold:
                logger.error("Header timestamp is anomalously far in the future")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Header validation exception: {e}")
            return False
