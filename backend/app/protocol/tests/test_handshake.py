import pytest
import time
from app.protocol.validation.replay import ReplayProtectionEngine
from app.protocol.handshake.challenge import ChallengeResponseEngine
from app.protocol.handshake.controller import HandshakeController
from app.protocol.state_machine.machine import SCPStateMachine, ProtocolState
from app.protocol.sessions.manager import SessionContextManager
from app.protocol.validation.identity import IdentityVerificationEngine
from app.protocol.errors.codes import ProtocolException, SCPErrorCode

class MockIdentityService:
    def get_identity(self, user_id):
        return {"identity_key_b64": "mock_pubkey"}

class MockDeviceService:
    def is_device_trusted(self, user_id, device_id):
        return True

class MockEventBus:
    async def publish(self, event):
        pass

@pytest.fixture
def handshake_env():
    session_manager = SessionContextManager()
    replay_engine = ReplayProtectionEngine(expiration_seconds=1)
    challenge_engine = ChallengeResponseEngine()
    identity_engine = IdentityVerificationEngine(MockIdentityService(), MockDeviceService())
    event_bus = MockEventBus()
    
    controller = HandshakeController(
        session_manager, replay_engine, challenge_engine, identity_engine, event_bus
    )
    return controller, replay_engine, challenge_engine

def test_replay_protection():
    engine = ReplayProtectionEngine()
    engine.check_packet_id("msg-1")
    
    with pytest.raises(ValueError) as exc:
        engine.check_packet_id("msg-1")
    assert "Replay detected" in str(exc.value)

def test_replay_protection_expiration():
    engine = ReplayProtectionEngine(expiration_seconds=0.1)
    engine.check_packet_id("msg-1")
    time.sleep(0.2)
    # Should not raise because it expired
    engine.check_packet_id("msg-1")

@pytest.mark.asyncio
async def test_handshake_flow(handshake_env):
    controller, _, challenge_engine = handshake_env
    
    # Init
    await controller.handle_handshake_init(1, "dev-1", "SCP/1.0")
    assert controller.state_machine.state == ProtocolState.NEGOTIATING
    
    # Capability
    caps = controller.handle_capability_exchange(["SUPPORTS_IDENTITY_KEYS"])
    assert "SUPPORTS_IDENTITY_KEYS" in caps
    assert controller.state_machine.state == ProtocolState.VERIFYING_IDENTITY
    
    # Challenge
    nonce = controller.generate_challenge()
    assert controller.state_machine.state == ProtocolState.CHALLENGE
    
    # Verify (Mock signature)
    session = await controller.verify_challenge_response(nonce, "mock_signature")
    assert session is not None
    assert session.client_id == 1
    assert session.device_id == "dev-1"
    assert controller.state_machine.state == ProtocolState.READY

@pytest.mark.asyncio
async def test_handshake_timeout(handshake_env):
    controller, _, _ = handshake_env
    controller.timeout_seconds = 0.1
    
    await controller.handle_handshake_init(1, "dev-1", "SCP/1.0")
    time.sleep(0.2)
    
    with pytest.raises(ProtocolException) as exc:
        controller.handle_capability_exchange([])
    assert exc.value.code == SCPErrorCode.PROTOCOL_VIOLATION
    assert controller.state_machine.state == ProtocolState.CLOSED

@pytest.mark.asyncio
async def test_challenge_expiration(handshake_env):
    controller, _, challenge_engine = handshake_env
    challenge_engine.timeout_seconds = 0.1
    
    await controller.handle_handshake_init(1, "dev-1", "SCP/1.0")
    controller.handle_capability_exchange([])
    nonce = controller.generate_challenge()
    
    time.sleep(0.2)
    with pytest.raises(ProtocolException) as exc:
        await controller.verify_challenge_response(nonce, "mock_sig")
    assert exc.value.code == SCPErrorCode.AUTHENTICATION_REQUIRED
