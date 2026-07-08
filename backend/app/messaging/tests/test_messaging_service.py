import pytest
import os
from app.messaging.services.secure_messaging_service import SecureMessagingService
from app.messaging.sessions.session_manager import SessionManager
from app.messaging.models.messages import OutboundMessage
from app.crypto.double_ratchet.models.state import DoubleRatchetState

@pytest.fixture
def session_manager():
    return SessionManager()

@pytest.fixture
def messaging_service(session_manager):
    return SecureMessagingService(session_manager)

@pytest.fixture
def active_session(session_manager):
    state = DoubleRatchetState(
        session_id="test_msg_session",
        root_key=os.urandom(32),
        sending_chain_key=os.urandom(32),
        receiving_chain_key=os.urandom(32),
        current_dh_public_key="ALICE_PUB",
        current_dh_private_key="ALICE_PRIV",
        protocol_version="1.0"
    )
    return session_manager.create_and_store_session(state, "dev_a")

def test_successful_message_cycle(messaging_service, active_session):
    # 1. Application logic constructs a simple OutboundMessage
    outbound = OutboundMessage(
        recipient_id="user_b",
        session_id="test_msg_session",
        plaintext_payload="Hello through the SecureMessagingService!"
    )
    
    # 2. Service encrypts it, returning an EncryptedMessage
    encrypted = messaging_service.send_message(outbound)
    assert encrypted is not None
    assert encrypted.session_id == "test_msg_session"
    assert encrypted.header.message_number == 0
    
    # 3. Simulate receiving the exact same message back (loopback for testing)
    inbound = messaging_service.receive_message(encrypted, sender_id="user_b")
    
    assert inbound is not None
    assert inbound.session_id == "test_msg_session"
    assert inbound.plaintext_payload == "Hello through the SecureMessagingService!"

def test_validation_rejection(messaging_service):
    outbound = OutboundMessage(
        recipient_id="user_b",
        session_id="test_msg_session",
        plaintext_payload="" # Empty payload should fail validation
    )
    
    encrypted = messaging_service.send_message(outbound)
    assert encrypted is None

def test_invalid_session(messaging_service):
    outbound = OutboundMessage(
        recipient_id="user_b",
        session_id="unknown_session",
        plaintext_payload="Hello"
    )
    
    encrypted = messaging_service.send_message(outbound)
    assert encrypted is None

def test_authentication_failure_handling(messaging_service, active_session):
    outbound = OutboundMessage(
        recipient_id="user_b",
        session_id="test_msg_session",
        plaintext_payload="Top Secret"
    )
    encrypted = messaging_service.send_message(outbound)
    
    # Tamper with header
    tampered_header = encrypted.header.model_copy(update={"message_number": 99})
    tampered_msg = encrypted.model_copy(update={"header": tampered_header})
    
    # Service must gracefully return None on authentication failure, not crash
    inbound = messaging_service.receive_message(tampered_msg, sender_id="user_b")
    assert inbound is None
