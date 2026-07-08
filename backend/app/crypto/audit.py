from app.audit.service import AuditService
from app.metrics.service import MetricsService
import logging

logger = logging.getLogger(__name__)

class CryptoAuditService:
    """
    Wrapper around AuditService specifically for cryptographic lifecycle events.
    Enforces strict rules on what can and cannot be logged.
    """
    def __init__(self, audit: AuditService, metrics: MetricsService):
        self.audit = audit
        self.metrics = metrics

    def log_key_registered(self, user_id: int, device_id: str, key_type: str):
        """Audits the registration of a new public key."""
        self.audit.log_action(
            "CRYPTO_KEY_REGISTERED", 
            user_id, 
            f"Device:{device_id}", 
            "SUCCESS", 
            details={"key_type": key_type}
        )
        self.metrics.increment("crypto_keys_registered")

    def log_key_rotated(self, user_id: int, device_id: str, key_type: str):
        """Audits the rotation of a public key."""
        self.audit.log_action(
            "CRYPTO_KEY_ROTATED", 
            user_id, 
            f"Device:{device_id}", 
            "SUCCESS", 
            details={"key_type": key_type}
        )
        self.metrics.increment("crypto_keys_rotated")

    def log_key_revoked(self, user_id: int, device_id: str, reason: str = "user_requested"):
        """Audits the revocation of a public key."""
        self.audit.log_action(
            "CRYPTO_KEY_REVOKED", 
            user_id, 
            f"Device:{device_id}", 
            "SUCCESS", 
            details={"reason": reason}
        )
        self.metrics.increment("crypto_keys_revoked")
        
    def _prevent_secret_logging(self, **kwargs):
        """Helper to explicitly guard against accidental secret logging."""
        forbidden = ["private_key", "secret", "plaintext", "message_key"]
        for key in kwargs.keys():
            if any(f in key.lower() for f in forbidden):
                logger.critical(f"Attempted to log forbidden cryptographic material: {key}")
                raise ValueError("CRITICAL SECURITY VIOLATION: Attempted to log secret material.")
