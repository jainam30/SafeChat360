import hashlib
import hmac
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

class HKDFDerivationEngine:
    """
    Implements HMAC-based Extract-and-Expand Key Derivation Function (HKDF).
    Used to compress the concatenated DH output into a 32-byte secure root secret.
    """
    
    @staticmethod
    def derive(input_key_material: bytes, salt: bytes = b"\0"*32, info: bytes = b"SafeChat360_X3DH") -> Tuple[bytes, bytes]:
        """
        Performs HKDF extract and expand.
        Returns (Root Secret, Associated Data)
        """
        # Extract Phase
        prk = hmac.new(salt, input_key_material, hashlib.sha256).digest()
        
        # Expand Phase (simulated split for Double Ratchet root vs. associated data)
        t1 = hmac.new(prk, info + b"\x01", hashlib.sha256).digest()
        t2 = hmac.new(prk, t1 + info + b"\x02", hashlib.sha256).digest()
        
        logger.debug("HKDF Derivation Complete")
        return t1, t2 # Initial Root Secret (32-bytes), Associated Data (32-bytes)
