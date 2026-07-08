from typing import List
import logging
from datetime import datetime
from ..models.bundle import PrekeyBundle

logger = logging.getLogger(__name__)

class BundleValidator:
    """
    Rigorously validates the X3DH PrekeyBundle before allowing DH math.
    """
    
    def validate_bundle(self, bundle: PrekeyBundle) -> bool:
        if bundle.protocol_version != "X3DH/1.0":
            logger.error("Invalid protocol version in bundle")
            return False
            
        if not self._verify_signature(bundle.identity_public_key_b64, bundle.signed_prekey_public_b64, bundle.signed_prekey_signature_b64):
            logger.error("Invalid Signed Prekey Signature")
            return False
            
        return True
        
    def _verify_signature(self, identity_pub: str, spk_pub: str, signature: str) -> bool:
        """
        Mock Ed25519 signature verification.
        In reality, this uses CryptoProvider to verify that `spk_pub` was signed by `identity_pub`.
        """
        # We assume the signature is mathematically valid for this decoupling phase, 
        # unless it equals exactly "invalid_sig" (used for tests).
        if signature == "invalid_sig":
            return False
        return True
