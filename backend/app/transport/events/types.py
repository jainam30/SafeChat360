from app.events.base import BaseEvent

# Phase F6.2: Transport Gateway Events
class ConnectionOpenedEvent(BaseEvent):
    event_type: str = "ConnectionOpened"

class ConnectionClosedEvent(BaseEvent):
    event_type: str = "ConnectionClosed"

class PacketReceivedEvent(BaseEvent):
    event_type: str = "PacketReceived"

class PacketRejectedEvent(BaseEvent):
    event_type: str = "PacketRejected"

class PacketDispatchedEvent(BaseEvent):
    event_type: str = "PacketDispatched"

class SessionResolvedEvent(BaseEvent):
    event_type: str = "SessionResolved"

class HeartbeatTimeoutEvent(BaseEvent):
    event_type: str = "HeartbeatTimeout"
