import pytest
import os
from typing import Set
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.derivation.symmetric import SymmetricRatchetEngine
from app.crypto.double_ratchet.ratchet_dh.advancer import RootKeyAdvancer

def test_symmetric_ratchet_forward_only():
    """
    Property: The symmetric ratchet must only advance forward.
    It must derive unique Message Keys and Chain Keys, and never roll back.
    """
    engine = SymmetricRatchetEngine()
    initial_state = DoubleRatchetState(
        session_id="prop_1",
        root_key=os.urandom(32),
        sending_chain_key=os.urandom(32),
        protocol_version="1.0"
    )
    
    seen_message_keys: Set[bytes] = set()
    seen_chain_keys: Set[bytes] = set()
    
    state = initial_state
    
    for i in range(100):
        # Assert counters match expected
        assert state.sending_message_number == i
        
        state, msg_key = engine.derive_next_sending(state)
        
        # Property: Uniqueness
        assert msg_key not in seen_message_keys
        assert state.sending_chain_key not in seen_chain_keys
        
        seen_message_keys.add(msg_key)
        seen_chain_keys.add(state.sending_chain_key)
        
        # Property: Message number increments
        assert state.sending_message_number == i + 1

def test_dh_ratchet_post_compromise_security():
    """
    Property: If the chain keys are compromised, a DH Ratchet step MUST
    establish completely fresh chain keys that cannot be calculated from the old ones.
    """
    advancer = RootKeyAdvancer()
    root_key_initial = os.urandom(32)
    
    # We pretend Alice receives Bob's new public key, and generates a new ephemeral pair
    # (In a real scenario, the secret is a shared ECDH point. Here we mock the secret).
    dh_secret = os.urandom(32)
    
    new_root, new_receiving_chain = advancer.advance(root_key_initial, dh_secret)
    
    # Property: The new Root and Chain keys must be cryptographically distinct
    assert new_root != root_key_initial
    assert len(new_root) == 32
    assert len(new_receiving_chain) == 32
    
    # Bob sends another message, Alice replies -> DH Ratchet advances again
    dh_secret_2 = os.urandom(32)
    new_root_2, new_sending_chain = advancer.advance(new_root, dh_secret_2)
    
    assert new_root_2 != new_root
    assert new_sending_chain != new_receiving_chain
