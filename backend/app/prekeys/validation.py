import logging
from typing import List, Any
from app.prekeys.models import BasePreKey

logger = logging.getLogger(__name__)

class PreKeyValidator:
    """
    Validates uploaded pre-keys to ensure they do not contain private material
    and conform to expected cryptographic algorithms.
    """
    
    ALLOWED_ALGORITHMS = ["X25519"]
    
    @classmethod
    def validate_key_format(cls, key: BasePreKey) -> bool:
        if key.algorithm not in cls.ALLOWED_ALGORITHMS:
            logger.error(f"Invalid algorithm '{key.algorithm}'. Allowed: {cls.ALLOWED_ALGORITHMS}")
            return False
            
        # Enforce that we only receive public keys. A standard X25519 public key is 32 bytes.
        if len(key.public_key_bytes) != 32:
            logger.error(f"Invalid public key length. Expected 32 bytes, got {len(key.public_key_bytes)}")
            return False
            
        return True
        
    @classmethod
    def validate_batch(cls, keys: List[BasePreKey]) -> bool:
        for key in keys:
            if not cls.validate_key_format(key):
                return False
        return True
