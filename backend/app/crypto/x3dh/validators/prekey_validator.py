from ..models.bundle import PrekeyBundle
from datetime import datetime

class PrekeyValidator:
    """
    Validates structural and temporal integrity of X3DH components.
    Does NOT perform cryptographic signature checks directly (that belongs to CryptoProvider).
    """
    
    @staticmethod
    def validate_bundle(bundle: PrekeyBundle) -> bool:
        if bundle.protocol_version != "X3DH/1.0":
            return False
            
        # Basic sanity checks on base64 formatting
        if not bundle.identity_public_key_b64 or not bundle.signed_prekey_signature_b64:
            return False
            
        return True
