import logging
import uuid
from typing import Optional, List
from datetime import datetime

from .models import HandshakeContext, SessionState, SessionStatus
from .state_machine import HandshakeState
from .repository import SessionRepository
from .handshake import HandshakeProcessor
from .events import SessionEventPublisher
from .metrics import SessionMetrics

logger = logging.getLogger(__name__)

class SessionManager:
    """
    Manages the lifecycle of Secure Sessions.
    """
    def __init__(
        self,
        repository: SessionRepository,
        processor: HandshakeProcessor,
        events: SessionEventPublisher,
        metrics: SessionMetrics
    ):
        self.repo = repository
        self.processor = processor
        self.events = events
        self.metrics = metrics

    async def initiate_handshake(self, initiator: str, recipient: str, protocol_version: str = "3.0") -> HandshakeContext:
        ctx = HandshakeContext(
            handshake_id=str(uuid.uuid4()),
            protocol_version=protocol_version,
            initiator_device=initiator,
            recipient_device=recipient,
            identity_key_id="",
            signed_prekey_id="",
            correlation_id=str(uuid.uuid4())
        )
        self.repo.save_handshake(ctx)
        
        self.metrics.record_handshake_started()
        await self.events.publish_handshake_started(initiator, recipient)
        
        self.processor.advance_state(ctx, HandshakeState.BUNDLE_REQUESTED)
        return ctx

    async def process_key_bundle(self, handshake_id: str, bundle: dict) -> HandshakeContext:
        ctx = self.repo.get_handshake(handshake_id)
        if not ctx:
            raise ValueError("Handshake not found")
            
        start_time = datetime.utcnow()
        await self.processor.process_bundle(ctx, bundle)
        
        # Calculate duration
        duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        self.metrics.record_handshake_success(duration)
        
        return ctx

    async def establish_session(self, handshake_id: str, root_secret_ref: str) -> SessionState:
        ctx = self.repo.get_handshake(handshake_id)
        if not ctx or ctx.state != HandshakeState.SHARED_SECRET_DERIVED:
            raise ValueError("Invalid handshake state for session creation")
            
        session_id = str(uuid.uuid4())
        session = SessionState(
            session_id=session_id,
            local_device_id=ctx.initiator_device,
            remote_device_id=ctx.recipient_device,
            protocol_version=ctx.protocol_version,
            handshake_timestamp=ctx.created_at,
            verification_status="VERIFIED",
            handshake_metadata={"handshake_id": handshake_id},
            status=SessionStatus.ACTIVE,
            root_secret_metadata_ref=root_secret_ref
        )
        
        # Replaces if exists per Phase F3.3 reqs
        if self.repo.get_active_session(ctx.initiator_device, ctx.recipient_device):
            self.repo.replace_session(session)
        else:
            self.repo.save_session(session)
            
        self.processor.advance_state(ctx, HandshakeState.SESSION_CREATED)
        self.processor.advance_state(ctx, HandshakeState.COMPLETED)
        
        self.metrics.record_session_created()
        await self.events.publish_session_created(session_id, ctx.initiator_device, ctx.recipient_device)
        
        return session
