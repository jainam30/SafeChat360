import pytest
from app.crypto.double_ratchet.initialization.initializer import DoubleRatchetInitializer
from app.crypto.x3dh.session.bootstrap import SecureBootstrapContext

@pytest.fixture
def mock_bootstrap_context():
    return SecureBootstrapContext(
        session_id="sess_123",
        protocol_version="X3DH/1.0",
        negotiated_capabilities=["CAP1"],
        target_device_id="bob_dev",
        _root_secret=b"\x01" * 32,
        associated_data=b"\x02" * 32
    )

def test_successful_initialization(mock_bootstrap_context):
    bob_pub = "BOB_DH_PUB_1"
    
    state = DoubleRatchetInitializer.initialize_as_alice(
        context=mock_bootstrap_context,
        bob_dh_pub=bob_pub
    )
    
    assert state is not None
    assert state.session_id == "sess_123"
    
    # Check Root Key
    assert state.root_key == b"\x01" * 32
    
    # Check Chain Key (Alice initializes sending chain)
    assert state.sending_chain_key == b"\x02" * 32
    assert state.receiving_chain_key is None
    
    # Check Counters
    assert state.sending_message_number == 0
    assert state.receiving_message_number == 0
    assert state.previous_chain_length == 0
    
    # Check DH Ratchet
    assert state.remote_dh_public_key == bob_pub
    assert state.current_dh_private_key is not None
    assert state.current_dh_public_key is not None

def test_invalid_root_secret_length():
    context = SecureBootstrapContext(
        session_id="sess_123",
        protocol_version="X3DH/1.0",
        negotiated_capabilities=[],
        target_device_id="bob",
        _root_secret=b"too_short",
        associated_data=b"data"
    )
    
    with pytest.raises(ValueError, match="Invalid X3DH Root Secret length"):
        DoubleRatchetInitializer.initialize_as_alice(context, "bob_pub")
