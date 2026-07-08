import pytest
import asyncio
from datetime import datetime, timedelta
from app.delivery.tracking.delivery_tracker import DeliveryTracker
from app.delivery.state.delivery_state_machine import MessageState
from app.delivery.ack.ack_manager import AckManager
from app.delivery.ack.ack_models import AckPacket
from app.delivery.retry.retry_scheduler import RetryScheduler
from app.crypto.message.aead.models import EncryptedMessage
from app.crypto.double_ratchet.headers.models import MessageHeader

@pytest.fixture
def mock_encrypted_msg():
    header = MessageHeader(
        header_uuid="header_123",
        protocol_version="1.0",
        session_id="session_A",
        sender_device_id="dev",
        ratchet_public_key="pub",
        previous_chain_length=0,
        message_number=1
    )
    return EncryptedMessage(
        message_uuid="msg_123",
        session_id="session_A",
        header=header,
        ciphertext=b"cipher",
        authentication_tag=b"tag"
    )

@pytest.fixture
def tracker():
    return DeliveryTracker()

@pytest.fixture
def ack_manager(tracker):
    return AckManager(tracker)

def test_state_machine_transitions(tracker, mock_encrypted_msg):
    # 1. Track New (Starts at ENCRYPTED)
    tracked = tracker.track_new(mock_encrypted_msg)
    assert tracked.state == MessageState.ENCRYPTED
    
    # 2. Transition ENCRYPTED -> QUEUED
    tracker.transition_state("msg_123", MessageState.QUEUED)
    assert tracker.get("msg_123").state == MessageState.QUEUED
    
    # 3. Transition QUEUED -> SENT
    tracker.transition_state("msg_123", MessageState.SENT)
    assert tracker.get("msg_123").state == MessageState.SENT
    
    # 4. Invalid Transition SENT -> ENCRYPTED
    tracker.transition_state("msg_123", MessageState.ENCRYPTED)
    assert tracker.get("msg_123").state == MessageState.SENT # Unchanged

def test_ack_processing(tracker, ack_manager, mock_encrypted_msg):
    tracker.track_new(mock_encrypted_msg)
    tracker.transition_state("msg_123", MessageState.SENT)
    
    ack = AckPacket(message_uuid="msg_123", session_id="session_A")
    
    # Process valid ACK
    result = ack_manager.process_ack(ack)
    assert result is True
    assert tracker.get("msg_123").state == MessageState.DELIVERED
    
    # Duplicate ACK should be rejected
    result_dup = ack_manager.process_ack(ack)
    assert result_dup is False
    
    # Spoofed ACK (wrong session)
    ack_spoof = AckPacket(message_uuid="msg_123", session_id="session_B")
    result_spoof = ack_manager.process_ack(ack_spoof)
    assert result_spoof is False

@pytest.mark.asyncio
async def test_retry_scheduler(tracker, mock_encrypted_msg):
    call_count = {"count": 0}
    
    async def mock_transport_send(session_id, encrypted):
        call_count["count"] += 1
        assert session_id == "session_A"
        assert encrypted.message_uuid == "msg_123"
        
    scheduler = RetryScheduler(tracker, mock_transport_send)
    
    # Setup message in SENT state
    tracked = tracker.track_new(mock_encrypted_msg)
    tracker.transition_state("msg_123", MessageState.SENT)
    
    # Artificially age the message past the 3-second timeout
    tracked.created_at = datetime.utcnow() - timedelta(seconds=4)
    
    # Run one tick of the scheduler
    await scheduler._scan_and_retry()
    
    # The message should have been retried
    assert call_count["count"] == 1
    assert tracked.retry_count == 1
