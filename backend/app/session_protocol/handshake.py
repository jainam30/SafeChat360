import logging
import uuid
from datetime import datetime

from .state_machine import HandshakeState
from .models import HandshakeContext
from .exceptions import InvalidStateTransitionError, HandshakeExpiredError
from .events import SessionEventPublisher
from .metrics import SessionMetrics
from .validator import BundleValidator

logger = logging.getLogger(__name__)

class HandshakeProcessor:
    def __init__(
        self, 
        validator: BundleValidator, 
        events: SessionEventPublisher, 
        metrics: SessionMetrics
    ):
        self.validator = validator
        self.events = events
        self.metrics = metrics

    def advance_state(self, ctx: HandshakeContext, new_state: HandshakeState):
        valid_transitions = {
            HandshakeState.INITIALIZED: [HandshakeState.BUNDLE_REQUESTED, HandshakeState.FAILED],
            HandshakeState.BUNDLE_REQUESTED: [HandshakeState.BUNDLE_RECEIVED, HandshakeState.FAILED, HandshakeState.EXPIRED],
            HandshakeState.BUNDLE_RECEIVED: [HandshakeState.BUNDLE_VALIDATED, HandshakeState.FAILED],
            HandshakeState.BUNDLE_VALIDATED: [HandshakeState.PREKEY_RESERVED, HandshakeState.FAILED],
            HandshakeState.PREKEY_RESERVED: [HandshakeState.SHARED_SECRET_DERIVED, HandshakeState.FAILED],
            HandshakeState.SHARED_SECRET_DERIVED: [HandshakeState.SESSION_CREATED, HandshakeState.FAILED],
            HandshakeState.SESSION_CREATED: [HandshakeState.COMPLETED, HandshakeState.FAILED]
        }
        
        allowed = valid_transitions.get(ctx.state, [])
        if new_state not in allowed:
            raise InvalidStateTransitionError(f"Cannot transition from {ctx.state} to {new_state}")
            
        ctx.state = new_state
        if new_state in [HandshakeState.COMPLETED, HandshakeState.FAILED, HandshakeState.ABORTED, HandshakeState.EXPIRED]:
            ctx.completed_at = datetime.utcnow()

    async def process_bundle(self, ctx: HandshakeContext, bundle: dict):
        try:
            self.advance_state(ctx, HandshakeState.BUNDLE_RECEIVED)
            
            # Validation
            self.validator.validate_bundle(bundle)
            self.advance_state(ctx, HandshakeState.BUNDLE_VALIDATED)
            
            await self.events.publish_bundle_validated(ctx.initiator_device, ctx.recipient_device)
            
            # Reservation
            if bundle.get("onetime_prekey_id"):
                ctx.onetime_prekey_id = bundle["onetime_prekey_id"]
            self.advance_state(ctx, HandshakeState.PREKEY_RESERVED)
            
            # Normally derivation happens here if server acts as client, otherwise server just routes it.
            # Assuming client completes derivation and notifies server to create session:
            self.advance_state(ctx, HandshakeState.SHARED_SECRET_DERIVED)
            
        except Exception as e:
            logger.warning(f"Handshake failed: {str(e)}")
            self.advance_state(ctx, HandshakeState.FAILED)
            ctx.error_info = str(e)
            self.metrics.record_handshake_failure(type(e).__name__)
            await self.events.publish_handshake_failed(ctx.handshake_id, str(e))
            raise e
