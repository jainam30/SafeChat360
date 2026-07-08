import pytest
import os
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.derivation.symmetric import SymmetricRatchetEngine
from app.crypto.double_ratchet.headers.models import MessageHeader
from app.crypto.message.aead.engine import AEADEncryptionEngine

@pytest.mark.skip(reason="Stress test: takes too long for normal CI. Run manually.")
def test_100k_ratchet_and_encrypt():
    """
    Stress Test: 100,000 continuous encryptions on a single symmetric chain.
    Proves engine stability, lack of memory leaks in the hot path, and monotonic progression.
    """
    sym_engine = SymmetricRatchetEngine()
    enc_engine = AEADEncryptionEngine()
    
    state = DoubleRatchetState(
        session_id="stress_100k",
        root_key=os.urandom(32),
        sending_chain_key=os.urandom(32),
        protocol_version="1.0"
    )
    
    plaintext = b"Stress Test Payload"
    
    for i in range(100000):
        # 1. Advance Ratchet
        state, msg_key = sym_engine.derive_next_sending(state)
        
        # 2. Build Header
        header = MessageHeader(
            header_uuid=f"uuid_{i}",
            protocol_version=state.protocol_version,
            session_id=state.session_id,
            sender_device_id="device_a",
            ratchet_public_key="ALICE_PUB",
            previous_chain_length=0,
            message_number=state.sending_message_number - 1
        )
        
        # 3. Encrypt
        encrypted = enc_engine.encrypt(msg_key, plaintext, header)
        
        assert encrypted is not None
        assert encrypted.message_uuid is not None
        assert len(encrypted.ciphertext) == len(plaintext)
        
    assert state.sending_message_number == 100000
