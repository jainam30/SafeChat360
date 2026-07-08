from typing import Dict, Any, Optional
from datetime import datetime
import logging

from app.events.bus import EventBus
from app.audit.service import AuditService

logger = logging.getLogger(__name__)

class IdentityService:
    """
    Manages the lifecycle and metadata of a user's enterprise identity.
    Provides foundational abstractions for future public key associations.
    """
    def __init__(self, event_bus: EventBus, audit: AuditService):
        self.event_bus = event_bus
        self.audit = audit
        # In-memory mock for identity metadata until database migrations are allowed
        self._identity_metadata: Dict[int, Dict[str, Any]] = {}

    def get_identity(self, user_id: int) -> Dict[str, Any]:
        return self._identity_metadata.get(user_id, {
            "status": "Active",
            "verified": False,
            "created_at": datetime.utcnow().isoformat(),
            "has_public_key": False
        })

    async def verify_identity(self, user_id: int):
        """
        Marks an identity as verified (e.g. after email/MFA validation).
        """
        identity = self.get_identity(user_id)
        identity["verified"] = True
        self._identity_metadata[user_id] = identity
        
        self.audit.log_action("IDENTITY_VERIFIED", user_id, str(user_id), "SUCCESS")
        
        # We assume IdentityVerifiedEvent will be added to events/types.py
        from app.events.types import IdentityVerifiedEvent
        await self.event_bus.publish(IdentityVerifiedEvent(
            actor_id=user_id,
            payload={"status": "verified"}
        ))

    async def link_public_key_metadata(self, user_id: int, key_id: str):
        """
        Prepares the identity record for future E2EE.
        Does not store the key, just tracks that the user has one registered.
        """
        identity = self.get_identity(user_id)
        identity["has_public_key"] = True
        identity["primary_key_id"] = key_id
        self._identity_metadata[user_id] = identity
        
        self.audit.log_action("IDENTITY_KEY_LINKED", user_id, key_id, "SUCCESS")
