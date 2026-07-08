from app.events.base import BaseEvent

# Phase F6.1: Messaging Service Events
class SessionStartedEvent(BaseEvent):
    event_type: str = "SessionStarted"

class MessageEncryptedEvent(BaseEvent):
    event_type: str = "MessageEncrypted"

class MessageDecryptedEvent(BaseEvent):
    event_type: str = "MessageDecrypted"

class MessageRejectedEvent(BaseEvent):
    event_type: str = "MessageRejected"

class SessionClosedEvent(BaseEvent):
    event_type: str = "SessionClosed"

class SessionExpiredEvent(BaseEvent):
    event_type: str = "SessionExpired"

class CryptoFailureEvent(BaseEvent):
    event_type: str = "CryptoFailure"
