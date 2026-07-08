import pytest
import asyncio
from datetime import datetime, timedelta
from app.offline.queue.queue_repository import OfflineQueueRepository
from app.offline.queue.queue_manager import OfflineQueueManager
from app.offline.scheduler.delivery_scheduler import DeliveryScheduler
from app.offline.recovery.session_recovery import SessionRecoveryManager
from app.delivery.tracking.delivery_tracker import DeliveryTracker
from app.delivery.state.delivery_state_machine import MessageState
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
        message_uuid="msg_offline_1",
        session_id="session_A",
        header=header,
        ciphertext=b"cipher",
        authentication_tag=b"tag"
    )

@pytest.fixture
def repo():
    return OfflineQueueRepository()
    
@pytest.fixture
def manager(repo):
    return OfflineQueueManager(repo, max_retention_days=30, max_queue_size=2)

def test_enqueue_and_limits(manager, mock_encrypted_msg):
    # Enqueue first message
    success = manager.enqueue_message("user_B", mock_encrypted_msg)
    assert success is True
    
    # Enqueue duplicate (should be suppressed but return True)
    success = manager.enqueue_message("user_B", mock_encrypted_msg)
    assert success is True
    assert len(manager.get_pending_messages("user_B")) == 1
    
    # Enqueue second message
    msg2 = mock_encrypted_msg.model_copy(update={"message_uuid": "msg_offline_2"})
    success = manager.enqueue_message("user_B", msg2)
    assert success is True
    assert len(manager.get_pending_messages("user_B")) == 2
    
    # Enqueue third message (Exceeds max_queue_size=2)
    msg3 = mock_encrypted_msg.model_copy(update={"message_uuid": "msg_offline_3"})
    success = manager.enqueue_message("user_B", msg3)
    assert success is False # Rejected

def test_message_expiration(manager, mock_encrypted_msg):
    manager.enqueue_message("user_B", mock_encrypted_msg)
    
    # Artificially age the message to 31 days old
    queued_msg = manager.repository.get_messages("user_B")[0]
    queued_msg.queued_at = datetime.utcnow() - timedelta(days=31)
    
    # Fetch pending messages (this triggers expiration sweep)
    pending = manager.get_pending_messages("user_B")
    
    assert len(pending) == 0
    assert len(manager.repository.get_messages("user_B")) == 0

def test_session_recovery_transition(manager, mock_encrypted_msg):
    tracker = DeliveryTracker()
    recovery = SessionRecoveryManager(tracker, manager)
    
    # Put a message in tracking, simulate a failure
    tracker.track_new(mock_encrypted_msg)
    tracker.transition_state("msg_offline_1", MessageState.FAILED)
    
    # Recover it to the offline queue
    success = recovery.transition_failed_to_offline("msg_offline_1", "user_B")
    
    assert success is True
    # It must be removed from active tracking memory
    assert tracker.get("msg_offline_1") is None
    # It must be in the offline queue
    assert len(manager.get_pending_messages("user_B")) == 1

@pytest.mark.asyncio
async def test_delivery_scheduler_flush(manager, mock_encrypted_msg):
    manager.enqueue_message("user_B", mock_encrypted_msg)
    
    call_count = {"count": 0}
    
    async def mock_transport_sender(session_id, msg):
        call_count["count"] += 1
        assert session_id == "session_A"
        assert msg.message_uuid == "msg_offline_1"
        
    scheduler = DeliveryScheduler(manager, mock_transport_sender)
    
    await scheduler.flush_queue_for_user("user_B", "session_A")
    
    # The message was transmitted to the transport layer
    assert call_count["count"] == 1
    
    # Note: It remains in the pending queue until the ACK manager explicitly acknowledges it
    assert len(manager.get_pending_messages("user_B")) == 1
    
    # Simulate ACK received
    manager.acknowledge_delivery("user_B", "msg_offline_1")
    assert len(manager.get_pending_messages("user_B")) == 0
