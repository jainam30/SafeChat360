from app.events.base import BaseEvent

# Phase F6.4: Offline Queue & Recovery Events
class OfflineMessageQueuedEvent(BaseEvent):
    event_type: str = "OfflineMessageQueued"

class OfflineMessageDequeuedEvent(BaseEvent):
    event_type: str = "OfflineMessageDequeued"

class DeliveryResumedEvent(BaseEvent):
    event_type: str = "DeliveryResumed"

class SessionRecoveredEvent(BaseEvent):
    event_type: str = "SessionRecovered"

class QueueExpiredEvent(BaseEvent):
    event_type: str = "QueueExpired"

class RecoveryFailedEvent(BaseEvent):
    event_type: str = "RecoveryFailed"
