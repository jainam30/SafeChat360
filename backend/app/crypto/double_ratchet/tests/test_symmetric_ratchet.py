import pytest
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.engine.symmetric import SymmetricRatchetEngine

@pytest.fixture
def initial_state():
    return DoubleRatchetState(
        session_id="sess_123",
        root_key=b"\x00" * 32,
        sending_chain_key=b"\x01" * 32,
        receiving_chain_key=b"\x02" * 32,
        current_dh_public_key="pub",
        current_dh_private_key="priv",
        remote_dh_public_key="remote",
        sending_message_number=0,
        receiving_message_number=0,
        previous_chain_length=0,
        protocol_version="1.0",
        capabilities=[],
        state_version=1
    )

def test_symmetric_ratchet_encrypt(initial_state):
    state = initial_state
    
    # Ratchet once
    new_state, msg_key1 = SymmetricRatchetEngine.ratchet_encrypt(state)
    
    # Verify state updated immutably
    assert new_state.session_id == state.session_id
    assert new_state.state_version == 2
    assert new_state.sending_message_number == 1
    assert new_state.sending_chain_key != b"\x01" * 32
    assert len(msg_key1) == 32
    
    # Old chain key reference should be gone from the object
    with pytest.raises(AttributeError):
        _ = state.sending_chain_key

def test_symmetric_ratchet_1000_sequential_messages(initial_state):
    state = initial_state
    keys = set()
    
    for i in range(1000):
        state, msg_key = SymmetricRatchetEngine.ratchet_encrypt(state)
        keys.add(msg_key)
        
        # Verify counters
        assert state.sending_message_number == i + 1
        assert state.state_version == i + 2
        
    # Verify uniqueness of 1000 derived message keys
    assert len(keys) == 1000

def test_symmetric_ratchet_decrypt_null_chain():
    state = DoubleRatchetState(
        session_id="sess_123",
        root_key=b"\x00" * 32,
        sending_chain_key=b"\x01" * 32,
        receiving_chain_key=None, # e.g. Alice before Bob replies
        protocol_version="1.0",
        capabilities=[]
    )
    
    with pytest.raises(ValueError, match="Receiving chain key is null"):
        SymmetricRatchetEngine.ratchet_decrypt(state)
