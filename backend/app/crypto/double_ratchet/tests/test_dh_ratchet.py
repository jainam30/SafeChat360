import pytest
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.ratchet_dh.engine import DHRatchetEngine
from app.crypto.double_ratchet.engine.symmetric import SymmetricRatchetEngine

@pytest.fixture
def initial_state():
    return DoubleRatchetState(
        session_id="sess_dh_123",
        root_key=b"\x00" * 32,
        sending_chain_key=b"\x01" * 32,
        receiving_chain_key=b"\x02" * 32,
        current_dh_public_key="ALICE_PUB_1",
        current_dh_private_key="ALICE_PRIV_1",
        remote_dh_public_key="BOB_PUB_1",
        sending_message_number=5,
        receiving_message_number=3,
        previous_chain_length=0,
        protocol_version="1.0",
        capabilities=[],
        state_version=1
    )

def test_dh_ratchet_success(initial_state):
    state = initial_state
    
    new_remote_pub = "BOB_PUB_2"
    
    # Execute DH Ratchet
    new_state = DHRatchetEngine.ratchet(state, new_remote_pub)
    
    assert new_state is not None
    assert new_state.state_version == 2
    
    # Counters should reset
    assert new_state.sending_message_number == 0
    assert new_state.receiving_message_number == 0
    
    # Previous chain length should capture old sending_message_number (5)
    assert new_state.previous_chain_length == 5
    
    # Keys should have rotated
    assert new_state.root_key != state.root_key
    assert len(new_state.root_key) == 32
    assert new_state.sending_chain_key != state.sending_chain_key
    assert new_state.receiving_chain_key != state.receiving_chain_key
    
    assert new_state.remote_dh_public_key == "BOB_PUB_2"
    assert new_state.current_dh_public_key != state.current_dh_public_key
    
    # Old private key should be deleted from old state reference
    with pytest.raises(AttributeError):
        _ = state.current_dh_private_key

def test_dh_ratchet_duplicate_key(initial_state):
    state = initial_state
    
    # Try to ratchet with the same key we already have
    duplicate_pub = "BOB_PUB_1"
    
    new_state = DHRatchetEngine.ratchet(state, duplicate_pub)
    
    # Should abort and return None
    assert new_state is None

def test_dh_ratchet_malformed_key(initial_state):
    state = initial_state
    
    malformed_pub = "MALFORMED_KEY_DATA"
    
    new_state = DHRatchetEngine.ratchet(state, malformed_pub)
    
    # Should abort and return None
    assert new_state is None

def test_alternating_ratchets(initial_state):
    # Simulate a realistic flow:
    # 1. Alice sends a message (Symmetric)
    # 2. Bob replies (DH Ratchet)
    # 3. Alice sends a message (Symmetric)
    
    state = initial_state
    
    # 1. Symmetric
    state, msg_key1 = SymmetricRatchetEngine.ratchet_encrypt(state)
    assert state.sending_message_number == 6
    
    # 2. DH Ratchet (Bob replied)
    state = DHRatchetEngine.ratchet(state, "BOB_PUB_2")
    assert state.sending_message_number == 0
    assert state.previous_chain_length == 6
    
    # 3. Symmetric
    state, msg_key2 = SymmetricRatchetEngine.ratchet_encrypt(state)
    assert state.sending_message_number == 1
