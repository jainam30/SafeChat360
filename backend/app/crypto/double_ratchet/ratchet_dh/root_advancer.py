import hashlib
import hmac
from typing import Tuple
import logging
from app.crypto.x3dh.derivation.hkdf import HKDFDerivationEngine
from app.crypto.x3dh.agreements.dh_engine import DHAgreementEngine

logger = logging.getLogger(__name__)

class RootKeyAdvancer:
    """
    Derives the New Root Key and New Chain Key by performing HKDF 
    on the DH shared secret and the current Root Key.
    """
    
    @staticmethod
    def advance(current_root_key: bytes, local_dh_priv: str, remote_dh_pub: str) -> Tuple[bytes, bytes]:
        """
        Returns (New Root Key, New Chain Key)
        """
        if not current_root_key or len(current_root_key) != 32:
            raise ValueError("Root key must be exactly 32 bytes.")

        # 1. Compute DH shared secret between our private key and their public key
        # We reuse the DH mock logic from Phase F4.2 (DHAgreementEngine._dh)
        dh_secret = DHAgreementEngine._dh(local_dh_priv, remote_dh_pub)
        
        # 2. Extract and Expand using HKDF
        # Root Key acts as the salt. DH Secret acts as the input key material.
        # This matches the Signal Double Ratchet Specification precisely.
        new_root_key, new_chain_key = HKDFDerivationEngine.derive(
            input_key_material=dh_secret,
            salt=current_root_key,
            info=b"SafeChat360_DHRatchet"
        )
        
        logger.debug("Root Key and Chain Key advanced successfully.")
        return new_root_key, new_chain_key
