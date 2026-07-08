import pytest
import asyncio
from app.services.messaging.entity import MessageEntity
from app.services.messaging.conversation import ConversationService
from app.services.messaging.status import MessageStatusMachine, MessageStatus

def test_conversation_resolution():
    service = ConversationService()
    
    # Direct
    conv1 = service.resolve_conversation(sender_id=5, receiver_id=2, group_id=None)
    assert conv1.id == "direct:2:5"
    assert conv1.type == "direct"
    
    # Direct reverse order
    conv2 = service.resolve_conversation(sender_id=2, receiver_id=5, group_id=None)
    assert conv2.id == "direct:2:5"
    
    # Group
    conv3 = service.resolve_conversation(sender_id=1, receiver_id=None, group_id=99)
    assert conv3.id == "group:99"
    assert conv3.type == "group"

def test_message_status_machine():
    machine = MessageStatusMachine()
    
    # Valid transition
    new_state = machine.transition(MessageStatus.DRAFT.value, MessageStatus.QUEUED.value)
    assert new_state == MessageStatus.QUEUED.value
    
    # Invalid transition (Sent to Draft)
    with pytest.raises(Exception):
        machine.transition(MessageStatus.SENT.value, MessageStatus.DRAFT.value)

def test_entity_defaults():
    entity = MessageEntity(
        conversation_id="test",
        sender_id=1,
        sender_username="test",
        content="hello"
    )
    assert entity.status == MessageStatus.DRAFT.value
    assert entity.type == "text"
    assert entity._is_valid is True
