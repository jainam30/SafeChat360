import hashlib
import hmac
import logging

logger = logging.getLogger(__name__)

class ChainKeyAdvancer:
    """
    Performs a mathematically one-way derivation to evolve the Chain Key.
    This guarantees Forward Secrecy for individual messages.
    """
    
    @staticmethod
    def advance(chain_key: bytes) -> bytes:
        """
        Derives the next Chain Key using HMAC-SHA256.
        According to Signal spec, Next Chain Key = HMAC-SHA256(ChainKey, 0x02)
        """
        if not chain_key or len(chain_key) != 32:
            raise ValueError("Chain key must be exactly 32 bytes.")
            
        next_chain_key = hmac.new(chain_key, b"\x02", hashlib.sha256).digest()
        logger.debug("Chain Key Advanced")
        return next_chain_key
