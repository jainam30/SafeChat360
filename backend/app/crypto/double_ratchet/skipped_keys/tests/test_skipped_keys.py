import pytest
from datetime import datetime, timedelta
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.skipped_keys.models import SkippedKeyRecord
from app.crypto.double_ratchet.skipped_keys.repository import InMemorySkippedKeyStore
from app.crypto.double_ratchet.skipped_keys.manager import SkippedKeyManager
from app.crypto.double_ratchet.skipped_keys.resolver import OutOfOrderResolver

@pytest.fixture
def store():
    return InMemorySkippedKeyStore()

@pytest.fixture
def initial_state():
    return DoubleRatchetState(
        session_id="session_skip",
        root_key=b"\x00"*32,
        receiving_chain_key=b"\x01"*32,
        receiving_message_number=2, # Expecting message 2 next
        protocol_version="1.0"
    )

def test_store_and_consume(store):
    record = SkippedKeyRecord(
        session_id="session_1",
        ratchet_public_key="pub_key_A",
        message_number=5,
        message_key=b"secret_key"
    )
    store.store(record)
    assert store.count() == 1
    
    # Consume exactly once
    key = store.consume("session_1", "pub_key_A", 5)
    assert key == b"secret_key"
    assert store.count() == 0
    
    # Try consuming again (Replay simulation)
    key_again = store.consume("session_1", "pub_key_A", 5)
    assert key_again is None

def test_cleanup_expired(store):
    # Store a key in the past
    record = SkippedKeyRecord(
        session_id="session_1",
        ratchet_public_key="pub_A",
        message_number=1,
        message_key=b"key",
        created_at=datetime.utcnow() - timedelta(days=8)
    )
    store.store(record)
    
    # Store a fresh key
    record_fresh = SkippedKeyRecord(
        session_id="session_1",
        ratchet_public_key="pub_A",
        message_number=2,
        message_key=b"key2"
    )
    store.store(record_fresh)
    
    assert store.count() == 2
    
    # Cleanup keys older than 7 days
    cleaned = store.cleanup_expired(max_age_seconds=7 * 24 * 3600)
    assert cleaned == 1
    assert store.count() == 1
    
    # Verify the fresh key is still there
    assert store.consume("session_1", "pub_A", 2) == b"key2"

def test_gap_resolution_and_harvesting(initial_state):
    resolver = OutOfOrderResolver(max_gap=100)
    
    # We expect message 2. But we receive message 5.
    # Therefore, message 2, 3, and 4 were skipped.
    new_state, skipped = resolver.resolve_gap(initial_state, 5)
    
    assert new_state.receiving_message_number == 5
    assert len(skipped) == 3
    
    # Check the harvested message numbers
    msg_nums = [s[0] for s in skipped]
    assert msg_nums == [2, 3, 4]

def test_manager_orchestration(store, initial_state):
    manager = SkippedKeyManager(store=store)
    
    remote_pub = "remote_pub_1"
    
    # 1. Receive message 5 (Gap of 3: skips 2,3,4)
    state_after_5, key_5 = manager.process_incoming(initial_state, 5, remote_pub)
    
    assert state_after_5.receiving_message_number == 5
    assert key_5 is None # We must still derive message 5 externally
    assert store.count() == 3 # 2, 3, 4 are stored
    
    # 2. Receive message 3 out of order (Delayed arrival)
    state_after_3, key_3 = manager.process_incoming(state_after_5, 3, remote_pub)
    
    # State should not advance, because 3 is in the past
    assert state_after_3.receiving_message_number == 5
    # But we should successfully recover the key
    assert key_3 is not None
    assert store.count() == 2
    
    # 3. Receive message 3 AGAIN (Replay attack)
    state_replay, key_replay = manager.process_incoming(state_after_5, 3, remote_pub)
    assert state_replay.receiving_message_number == 5
    assert key_replay is None # Rejected!
