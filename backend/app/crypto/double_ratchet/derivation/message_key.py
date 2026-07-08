import hashlib
import hmac
import logging

logger = logging.getLogger(__name__)

class MessageKeyManager:
    """
    Extracts a one-time Message Key from the current Chain Key.
    """
    
    @staticmethod
    def derive(chain_key: bytes) -> bytes:
        """
        Derives the Message Key using HMAC-SHA256.
        According to Signal spec, Message Key = HMAC-SHA256(ChainKey, 0x01)
        """
        if not chain_key or len(chain_key) != 32:
            raise ValueError("Chain key must be exactly 32 bytes.")
            
        message_key = hmac.new(chain_key, b"\x01", hashlib.sha256).digest()
        logger.debug("Derived unique Message Key")
        return message_key
