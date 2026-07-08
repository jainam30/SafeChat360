import logging

logger = logging.getLogger(__name__)

class RootKeyManager:
    """
    Initializes the Double Ratchet Root Key.
    The root key is seeded directly from the X3DH Initial Root Secret.
    """
    @staticmethod
    def initialize(x3dh_root_secret: bytes) -> bytes:
        if not x3dh_root_secret or len(x3dh_root_secret) != 32:
            raise ValueError("Invalid X3DH Root Secret length. Must be 32 bytes.")
            
        logger.debug("Root Key initialized from X3DH secret")
        return x3dh_root_secret
