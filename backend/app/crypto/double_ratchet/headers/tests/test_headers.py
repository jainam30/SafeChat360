import pytest
from datetime import datetime, timedelta
import uuid
import time
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.headers.builder import HeaderBuilder
from app.crypto.double_ratchet.headers.validator import HeaderValidator
from app.crypto.double_ratchet.headers.serializer import HeaderSerializer
from app.crypto.double_ratchet.headers.parser import HeaderParser

@pytest.fixture
def mock_state():
    return DoubleRatchetState(
        session_id="sess_header_123",
        root_key=b"\x00" * 32,
        current_dh_public_key="ALICE_PUB_H1",
        current_dh_private_key="ALICE_PRIV_H1",
        sending_message_number=42,
        previous_chain_length=15,
        protocol_version="1.0",
        capabilities=["AEAD"]
    )

def test_header_builder(mock_state):
    builder = HeaderBuilder()
    header = builder.build(mock_state, "device_a")
    
    assert header.session_id == "sess_header_123"
    assert header.message_number == 42
    assert header.previous_chain_length == 15
    assert header.ratchet_public_key == "ALICE_PUB_H1"
    assert header.sender_device_id == "device_a"
    assert len(header.header_uuid) > 10

def test_header_serialization_determinism(mock_state):
    builder = HeaderBuilder()
    header = builder.build(mock_state, "device_a")
    
    serializer = HeaderSerializer()
    bytes_1 = serializer.serialize(header)
    bytes_2 = serializer.serialize(header)
    
    # Must be perfectly deterministic
    assert bytes_1 == bytes_2
    
def test_header_parser(mock_state):
    builder = HeaderBuilder()
    header = builder.build(mock_state, "device_a")
    
    serializer = HeaderSerializer()
    raw_bytes = serializer.serialize(header)
    
    parser = HeaderParser()
    parsed_header = parser.parse(raw_bytes)
    
    assert parsed_header.header_uuid == header.header_uuid
    assert parsed_header.message_number == header.message_number
    assert parsed_header.timestamp == header.timestamp

def test_header_validation():
    validator = HeaderValidator()
    builder = HeaderBuilder()
    
    state = DoubleRatchetState(
        session_id="valid",
        root_key=b"\x00"*32,
        current_dh_public_key="pub",
        protocol_version="1.0",
        capabilities=[]
    )
    
    header = builder.build(state, "dev")
    assert validator.validate(header) is True
    
    # Test Future Timestamp Anomaly
    future_header = header.model_copy(update={'timestamp': datetime.utcnow() + timedelta(hours=2)})
    assert validator.validate(future_header) is False
    
    # Test Negative Counters
    negative_header = header.model_copy(update={'message_number': -1})
    assert validator.validate(negative_header) is False

def test_1000_sequential_headers(mock_state):
    builder = HeaderBuilder()
    uuids = set()
    
    state = mock_state
    
    for i in range(1000):
        state.sending_message_number = i
        header = builder.build(state, "dev")
        uuids.add(header.header_uuid)
        
    # Ensure UUIDs are globally unique despite rapid creation
    assert len(uuids) == 1000
