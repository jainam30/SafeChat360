import pytest
import os
import random
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.skipped_keys.repository import InMemorySkippedKeyStore
from app.crypto.double_ratchet.skipped_keys.manager import SkippedKeyManager

def test_out_of_order_fuzzing():
    """
    Property: No matter what order packets arrive in, exactly-once consumption
    and gap resolution guarantees all unique packets are successfully processed, 
    and all replays are rejected.
    """
    store = InMemorySkippedKeyStore(max_keys=5000)
    manager = SkippedKeyManager(store=store, max_gap=1000)
    
    state = DoubleRatchetState(
        session_id="fuzz_gaps",
        root_key=os.urandom(32),
        receiving_chain_key=os.urandom(32),
        receiving_message_number=1,
        protocol_version="1.0"
    )
    
    remote_pub = "remote_pub"
    
    # We want to process messages 1 through 100, but in a completely random order.
    # We will also insert 20 duplicates (replays).
    message_sequence = list(range(1, 101))
    replays = [random.randint(1, 100) for _ in range(20)]
    full_sequence = message_sequence + replays
    random.shuffle(full_sequence)
    
    successful_decryptions = set()
    rejected_replays = 0
    
    current_state = state
    
    for msg_num in full_sequence:
        current_state, key = manager.process_incoming(current_state, msg_num, remote_pub)
        
        if key is not None or current_state.receiving_message_number == msg_num:
            # If key is returned from store, or if we are aligned (key derived externally)
            # We count this as a success if we haven't seen it before
            if msg_num in successful_decryptions:
                # Should not happen because store deletes keys upon consumption, 
                # and aligned state would fail in real decryption if reused (or manager would reject)
                pass 
            else:
                successful_decryptions.add(msg_num)
        else:
            rejected_replays += 1
            
    # Properties:
    # 1. We must have successfully processed exactly the 100 unique messages.
    assert len(successful_decryptions) == 100
    # 2. We must have rejected exactly the 20 replays.
    assert rejected_replays == 20
    # 3. The state's receiving_message_number must end exactly at the max message number + 1
    assert current_state.receiving_message_number == 101
    # 4. The store must be completely empty (all skipped keys were consumed).
    assert store.count() == 0
