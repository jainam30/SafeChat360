from app.events.base import BaseEvent

# Phase F6.3: Delivery & ACK Events
class MessageQueuedEvent(BaseEvent):
    event_type: str = "MessageQueued"

class MessageSentEvent(BaseEvent):
    event_type: str = "MessageSent"

class ACKReceivedEvent(BaseEvent):
    event_type: str = "ACKReceived"

class ACKRejectedEvent(BaseEvent):
    event_type: str = "ACKRejected"

class RetryScheduledEvent(BaseEvent):
    event_type: str = "RetryScheduled"

class RetrySucceededEvent(BaseEvent):
    event_type: str = "RetrySucceeded"

class RetryFailedEvent(BaseEvent):
    event_type: str = "RetryFailed"

class DeliveryCompletedEvent(BaseEvent):
    event_type: str = "DeliveryCompleted"
