from app.events.base import BaseEvent

# Phase F7.1: Group Administration Events
class GroupCreatedEvent(BaseEvent):
    event_type: str = "GroupCreated"

class GroupDeletedEvent(BaseEvent):
    event_type: str = "GroupDeleted"

class MemberAddedEvent(BaseEvent):
    event_type: str = "MemberAdded"

class MemberRemovedEvent(BaseEvent):
    event_type: str = "MemberRemoved"

class InvitationCreatedEvent(BaseEvent):
    event_type: str = "InvitationCreated"

class InvitationAcceptedEvent(BaseEvent):
    event_type: str = "InvitationAccepted"

class InvitationRejectedEvent(BaseEvent):
    event_type: str = "InvitationRejected"

class RoleChangedEvent(BaseEvent):
    event_type: str = "RoleChanged"
