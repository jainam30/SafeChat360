from typing import Dict, Any, Optional
import logging

from app.audit.service import AuditService
from .interfaces import KeyStore, CryptographicIdentity

logger = logging.getLogger(__name__)

class KeyManagementService:
    """
    Manages the lifecycle of public keys for E2EE.
    Does NOT perform encryption or store private keys.
    """
    def __init__(self, key_store: KeyStore, audit: AuditService):
        self.key_store = key_store
        self.audit = audit

    def register_public_keys(self, user_id: int, identity: CryptographicIdentity):
        """
        Called when a user sets up E2EE for the first time.
        """
        self.key_store.save_identity(user_id, identity)
        self.audit.log_action("KMS_KEYS_REGISTERED", user_id, identity.identity_key, "SUCCESS")

    def get_public_keys(self, user_id: int) -> CryptographicIdentity:
        """
        Called by another user who wishes to initiate an E2EE session.
        """
        return self.key_store.get_identity(user_id)

    def rotate_signed_pre_key(self, user_id: int, new_signed_pre_key: str):
        identity = self.get_public_keys(user_id)
        # Update the signed pre-key logic here
        self.key_store.save_identity(user_id, identity)
        self.audit.log_action("KMS_KEY_ROTATED", user_id, "signed_pre_key", "SUCCESS")
