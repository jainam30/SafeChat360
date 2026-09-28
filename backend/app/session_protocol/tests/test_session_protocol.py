import pytest
import uuid
import asyncio
from datetime import datetime
from app.session_protocol.models import HandshakeState, SessionStatus
from app.session_protocol.manager import SessionManager
from app.session_protocol.repository import SessionRepository
from app.session_protocol.handshake import HandshakeProcessor
from app.session_protocol.validator import BundleValidator
from app.session_protocol.events import SessionEventPublisher
from app.session_protocol.metrics import SessionMetrics
from app.session_protocol.exceptions import BundleValidationError, PreKeyConsumedError

class MockEventBus:
    async def publish(self, event):
        pass

class MockMetricsService:
    def increment(self, name):
        pass
    def record_latency(self, name, val):
        pass

@pytest.fixture
def manager():
    repo = SessionRepository()
    validator = BundleValidator(repo)
    bus = MockEventBus()
    metrics = MockMetricsService()
    
    events = SessionEventPublisher(bus)
    session_metrics = SessionMetrics(metrics)
    
    processor = HandshakeProcessor(validator, events, session_metrics)
    return SessionManager(repo, processor, events, session_metrics)

@pytest.mark.asyncio
async def test_successful_handshake(manager):
    initiator = "device_A"
    recipient = "device_B"
    
    ctx = await manager.initiate_handshake(initiator, recipient)
    assert ctx.state == HandshakeState.BUNDLE_REQUESTED
    
    bundle = {
        "protocol_version": "3.0",
        "identity_key_id": "ik_1",
        "signed_prekey_id": "spk_1",
        "onetime_prekey_id": "otpk_1"
    }
    
    ctx = await manager.process_key_bundle(ctx.handshake_id, bundle)
    assert ctx.state == HandshakeState.SHARED_SECRET_DERIVED
    
    session = await manager.establish_session(ctx.handshake_id, "ref_secret_abc")
    assert session.status == SessionStatus.ACTIVE
    assert ctx.state == HandshakeState.COMPLETED
    assert session.root_secret_metadata_ref == "ref_secret_abc"

@pytest.mark.asyncio
async def test_replay_attack_otpk(manager):
    initiator = "device_A"
    recipient = "device_B"
    ctx = await manager.initiate_handshake(initiator, recipient)
    
    bundle = {
        "protocol_version": "3.0",
        "identity_key_id": "ik_1",
        "signed_prekey_id": "spk_1",
        "onetime_prekey_id": "otpk_1"
    }
    
    await manager.process_key_bundle(ctx.handshake_id, bundle)
    
    # Second handshake with same OTPK
    ctx2 = await manager.initiate_handshake("device_C", recipient)
    with pytest.raises(PreKeyConsumedError):
        await manager.process_key_bundle(ctx2.handshake_id, bundle)
        
@pytest.mark.asyncio
async def test_protocol_mismatch(manager):
    ctx = await manager.initiate_handshake("A", "B")
    bundle = {
        "protocol_version": "2.0",
        "identity_key_id": "ik_1",
        "signed_prekey_id": "spk_1"
    }
    with pytest.raises(BundleValidationError):
        await manager.process_key_bundle(ctx.handshake_id, bundle)
