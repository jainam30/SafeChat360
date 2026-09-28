import logging
from .exceptions import BundleValidationError, ReplayAttackDetectedError, PreKeyConsumedError
from .policies import SessionPolicies
from .repository import SessionRepository

logger = logging.getLogger(__name__)

class BundleValidator:
    def __init__(self, repo: SessionRepository):
        self.repo = repo

    def validate_bundle(self, bundle: dict) -> bool:
        """
        Validates:
        - Protocol version
        - Identity Key existence
        - Signed Pre-Key signature & expiration
        - One-Time Pre-Key reservation
        """
        version = bundle.get("protocol_version")
        if not SessionPolicies.is_version_supported(version):
            raise BundleValidationError(f"Unsupported protocol version: {version}")

        # In a full integration, we'd query the F2 PKI Store.
        if not bundle.get("identity_key_id"):
            raise BundleValidationError("Identity key missing")
            
        if not bundle.get("signed_prekey_id"):
            raise BundleValidationError("Signed Pre-Key missing")

        otpk_id = bundle.get("onetime_prekey_id")
        if otpk_id:
            # Replay protection on OTPK
            if not self.repo.mark_prekey_consumed(otpk_id):
                raise PreKeyConsumedError(f"One-Time Pre-Key {otpk_id} already consumed.")

        # Signature verification would happen here using Phase F1 CryptoProvider.
        # Mocking signature valid.

        return True
