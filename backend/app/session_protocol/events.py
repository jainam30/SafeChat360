from app.events.bus import EventBus
from app.events.types import BaseEvent

class SessionProtocolEvent(BaseEvent):
    pass

class HandshakeStartedEvent(SessionProtocolEvent):
    event_type: str = "HandshakeStarted"

class BundleValidatedEvent(SessionProtocolEvent):
    event_type: str = "BundleValidated"

class SharedSecretDerivedEvent(SessionProtocolEvent):
    event_type: str = "SharedSecretDerived"

class SessionCreatedEvent(SessionProtocolEvent):
    event_type: str = "SessionCreated"

class SessionActivatedEvent(SessionProtocolEvent):
    event_type: str = "SessionActivated"

class SessionExpiredEvent(SessionProtocolEvent):
    event_type: str = "SessionExpired"

class HandshakeRejectedEvent(SessionProtocolEvent):
    event_type: str = "HandshakeRejected"

class HandshakeFailedEvent(SessionProtocolEvent):
    event_type: str = "HandshakeFailed"

class SessionEventPublisher:
    def __init__(self, bus: EventBus):
        self.bus = bus

    async def publish_handshake_started(self, initiator: str, target: str):
        await self.bus.publish(HandshakeStartedEvent(actor_id=0, payload={"target": target}))

    async def publish_bundle_validated(self, initiator: str, target: str):
        await self.bus.publish(BundleValidatedEvent(actor_id=0, payload={"target": target}))

    async def publish_session_created(self, session_id: str, local: str, remote: str):
        await self.bus.publish(SessionCreatedEvent(actor_id=0, payload={"session_id": session_id, "remote": remote}))

    async def publish_handshake_failed(self, handshake_id: str, reason: str):
        await self.bus.publish(HandshakeFailedEvent(actor_id=0, payload={"handshake_id": handshake_id, "reason": reason}))
