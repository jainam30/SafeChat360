import logging
import uuid
from datetime import datetime
from typing import Optional
from .ephemeral import EphemeralKeyManager
from ..agreements.dh_engine import DHAgreementEngine
from ..derivation.hkdf import HKDFDerivationEngine
from ..models.bundle import PrekeyBundle
from ..validators.bundle_validator import BundleValidator
from ..session.bootstrap import SecureBootstrapContext

logger = logging.getLogger(__name__)

class X3DHEngine:
    """
    The Master Orchestrator for establishing a Secure Session Bootstrap Context.
    """
    def __init__(
        self, 
        validator: BundleValidator, 
        dh_engine: DHAgreementEngine, 
        hkdf_engine: HKDFDerivationEngine
    ):
        self.validator = validator
        self.dh_engine = dh_engine
        self.hkdf_engine = hkdf_engine

    def execute_agreement(
        self, 
        ik_a_priv: str, 
        target_bundle: PrekeyBundle
    ) -> Optional[SecureBootstrapContext]:
        
        logger.info(f"Initiating X3DH Agreement with Bundle {target_bundle.bundle_id}")
        
        # 1. Validate Bundle Integrity & Signatures
        if not self.validator.validate_bundle(target_bundle):
            logger.error("X3DH Aborted: Bundle validation failed")
            return None

        # 2. Generate Ephemeral Key (EK_a)
        ek_a_priv, ek_a_pub = EphemeralKeyManager.generate_keypair()

        try:
            # 3. Execute DH Mathematics
            concatenated_secret = self.dh_engine.execute_x3dh(
                ik_a_priv=ik_a_priv,
                ek_a_priv=ek_a_priv,
                ik_b_pub=target_bundle.identity_public_key_b64,
                spk_b_pub=target_bundle.signed_prekey_public_b64,
                opk_b_pub=target_bundle.one_time_prekey_public_b64
            )

            # 4. Extract and Expand using HKDF
            root_secret, associated_data = self.hkdf_engine.derive(concatenated_secret)

            # 5. Package into Secure Bootstrap Context
            context = SecureBootstrapContext(
                session_id=str(uuid.uuid4()),
                protocol_version=target_bundle.protocol_version,
                negotiated_capabilities=target_bundle.capabilities,
                target_device_id=target_bundle.device_id,
                _root_secret=root_secret, # Private field
                associated_data=associated_data
            )
            
            logger.info("X3DH Agreement Successful. Bootstrap Context Created.")
            return context

        except Exception as e:
            logger.error(f"X3DH Agreement Failed: {e}")
            return None
        finally:
            # 6. Strict Zeroization
            EphemeralKeyManager.zeroize(ek_a_priv)
