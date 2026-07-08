from app.protocol.state_machine.machine import SCPStateMachine, ProtocolState
from app.protocol.sessions.manager import SessionContextManager, SessionContext
from app.protocol.validation.replay import ReplayProtectionEngine
from app.protocol.handshake.challenge import ChallengeResponseEngine
from app.protocol.validation.identity import IdentityVerificationEngine
from app.protocol.capabilities.flags import CapabilityNegotiator
from app.protocol.errors.codes import ProtocolException, SCPErrorCode
from app.events.bus import EventBus
from app.events.types import (
    ProtocolHandshakeStartedEvent, ProtocolHandshakeCompletedEvent, 
    ProtocolErrorEvent, ProtocolSessionPreparedEvent
)
import time
import logging

logger = logging.getLogger(__name__)

class HandshakeController:
    """
    Orchestrates the entire SafeChat Protocol Handshake Sequence.
    Ensures that unauthenticated clients cannot reach business logic.
    """
    def __init__(
        self,
        session_manager: SessionContextManager,
        replay_engine: ReplayProtectionEngine,
        challenge_engine: ChallengeResponseEngine,
        identity_engine: IdentityVerificationEngine,
        event_bus: EventBus
    ):
        self.state_machine = SCPStateMachine()
        self.session_manager = session_manager
        self.replay_engine = replay_engine
        self.challenge_engine = challenge_engine
        self.identity_engine = identity_engine
        self.event_bus = event_bus
        
        # Temporary Handshake State
        self._temp_client_id = None
        self._temp_device_id = None
        self._temp_version = None
        self._temp_capabilities = []
        self._temp_fingerprint = None
        
        self.handshake_start_time = time.time()
        self.timeout_seconds = 5.0

    def check_timeout(self):
        if time.time() - self.handshake_start_time > self.timeout_seconds:
            self._abort(SCPErrorCode.PROTOCOL_VIOLATION, "Handshake timed out")

    async def handle_handshake_init(self, client_id: int, device_id: str, version: str):
        self.check_timeout()
        self.state_machine.transition(ProtocolState.CONNECTING)
        
        self._temp_client_id = client_id
        self._temp_device_id = device_id
        self._temp_version = version
        
        await self.event_bus.publish(ProtocolHandshakeStartedEvent(
            actor_id=client_id,
            payload={"device_id": device_id}
        ))
        
        self.state_machine.transition(ProtocolState.NEGOTIATING)

    def handle_capability_exchange(self, capabilities: list) -> list:
        self.check_timeout()
        if self.state_machine.state != ProtocolState.NEGOTIATING:
            self._abort(SCPErrorCode.PROTOCOL_VIOLATION, "Unexpected CapabilityExchange")
            
        self._temp_capabilities = CapabilityNegotiator.intersect(capabilities)
        self.state_machine.transition(ProtocolState.VERIFYING_IDENTITY)
        return self._temp_capabilities

    def generate_challenge(self) -> str:
        self.check_timeout()
        if self.state_machine.state != ProtocolState.VERIFYING_IDENTITY:
            self._abort(SCPErrorCode.PROTOCOL_VIOLATION, "Unexpected Challenge Request")
            
        public_key_b64 = self.identity_engine.verify_device_identity(
            self._temp_client_id, self._temp_device_id
        )
        self._temp_fingerprint = "mock_fingerprint" # Derive from public_key_b64
        
        nonce = self.challenge_engine.generate_challenge()
        self.state_machine.transition(ProtocolState.CHALLENGE)
        return nonce

    async def verify_challenge_response(self, nonce: str, signature: str) -> SessionContext:
        self.check_timeout()
        if self.state_machine.state != ProtocolState.CHALLENGE:
            self._abort(SCPErrorCode.PROTOCOL_VIOLATION, "Unexpected Challenge Response")
            
        public_key_b64 = self.identity_engine.verify_device_identity(
            self._temp_client_id, self._temp_device_id
        )
        
        try:
            self.challenge_engine.verify_challenge(nonce, signature, public_key_b64)
        except ValueError as e:
            self._abort(SCPErrorCode.AUTHENTICATION_REQUIRED, str(e))
            
        self.state_machine.transition(ProtocolState.AUTHENTICATED)
        
        session = self.session_manager.create_session(
            client_id=self._temp_client_id,
            device_id=self._temp_device_id,
            fingerprint=self._temp_fingerprint,
            version=self._temp_version,
            caps=self._temp_capabilities
        )
        
        await self.event_bus.publish(ProtocolHandshakeCompletedEvent(
            actor_id=self._temp_client_id,
            payload={"session_id": session.session_id}
        ))
        
        self.state_machine.transition(ProtocolState.READY)
        return session

    def _abort(self, code: SCPErrorCode, message: str):
        self.state_machine.transition(ProtocolState.CLOSED)
        self.destroy()
        raise ProtocolException(code=code, message=message, is_recoverable=False)

    def destroy(self):
        """Zeroize all temporary secrets and state."""
        self.replay_engine.destroy_state()
        self.challenge_engine.destroy_state()
        self._temp_client_id = None
        self._temp_device_id = None
        self._temp_version = None
        self._temp_capabilities = []
        self._temp_fingerprint = None
