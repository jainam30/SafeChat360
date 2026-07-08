import pytest
import time
import os
from app.crypto.double_ratchet.headers.models import MessageHeader
from app.crypto.message.aead.engine import AEADEncryptionEngine
from app.crypto.double_ratchet.derivation.symmetric import SymmetricRatchetEngine
from app.crypto.double_ratchet.models.state import DoubleRatchetState

def test_aead_encryption_latency():
    """
    Benchmark: AEAD Encryption (AES-GCM) should be highly performant.
    Target: < 5ms per encryption on average.
    """
    enc_engine = AEADEncryptionEngine()
    header = MessageHeader(
        header_uuid="perf_uuid",
        protocol_version="1.0",
        session_id="perf_session",
        sender_device_id="dev",
        ratchet_public_key="pub",
        previous_chain_length=0,
        message_number=1
    )
    msg_key = os.urandom(32)
    plaintext = b"A standard length chat message payload for benchmarking."
    
    start_time = time.perf_counter()
    
    # Run 1000 encryptions
    for _ in range(1000):
        enc_engine.encrypt(msg_key, plaintext, header)
        
    end_time = time.perf_counter()
    
    total_time = end_time - start_time
    avg_time_ms = (total_time / 1000) * 1000
    
    print(f"\nAEAD Encryption Average Latency: {avg_time_ms:.3f} ms")
    
    # Assert performance threshold
    assert avg_time_ms < 5.0, f"Encryption is too slow: {avg_time_ms}ms per op"

def test_symmetric_ratchet_latency():
    """
    Benchmark: HKDF Ratchet advancement.
    Target: < 2ms per derive_next operation.
    """
    sym_engine = SymmetricRatchetEngine()
    state = DoubleRatchetState(
        session_id="perf_sym",
        root_key=os.urandom(32),
        sending_chain_key=os.urandom(32),
        protocol_version="1.0"
    )
    
    start_time = time.perf_counter()
    
    for _ in range(1000):
        state, _ = sym_engine.derive_next_sending(state)
        
    end_time = time.perf_counter()
    
    total_time = end_time - start_time
    avg_time_ms = (total_time / 1000) * 1000
    
    print(f"\nSymmetric Ratchet Average Latency: {avg_time_ms:.3f} ms")
    assert avg_time_ms < 2.0, f"Ratchet is too slow: {avg_time_ms}ms per op"
