import os
import logging
from .interfaces import INonceGenerator

logger = logging.getLogger(__name__)

class NonceGenerator(INonceGenerator):
    """
    Generates cryptographically secure nonces for AES-GCM.
    """
    
    def generate(self) -> bytes:
        """
        AES-GCM securely requires a 96-bit (12-byte) nonce.
        Since we derive a completely unique MessageKey for EVERY message 
        using the Double Ratchet, random nonce collision probability 
        for a given key is virtually mathematically zero.
        """
        nonce = os.urandom(12)
        logger.debug("Generated fresh 96-bit AES-GCM Nonce")
        return nonce
