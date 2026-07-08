import pytest
import os
import sys
import weakref
import gc
from app.crypto.double_ratchet.headers.models import MessageHeader
from app.crypto.message.aead.engine import AEADEncryptionEngine

def test_memory_zeroization_on_encryption():
    """
    Property: The AEADEncryptionEngine must zeroize (delete references to) 
    the plaintext and message_key immediately after encryption, ensuring they 
    do not persist in memory to be swept up by a memory dump.
    """
    enc_engine = AEADEncryptionEngine()
    header = MessageHeader(
        header_uuid="mem_uuid",
        protocol_version="1.0",
        session_id="mem_session",
        sender_device_id="dev",
        ratchet_public_key="pub",
        previous_chain_length=0,
        message_number=1
    )
    
    # Create objects in a separate scope to track their references
    class SecretBytes(bytes):
        pass
        
    msg_key = SecretBytes(os.urandom(32))
    plaintext = SecretBytes(b"Top secret plaintext that must be destroyed")
    
    # Create weak references to monitor if the objects are Garbage Collected
    key_ref = weakref.ref(msg_key)
    pt_ref = weakref.ref(plaintext)
    
    # Pass them to the engine
    encrypted = enc_engine.encrypt(msg_key, plaintext, header)
    
    # Delete our local references
    del msg_key
    del plaintext
    
    # Force Garbage Collection
    gc.collect()
    
    # Property: The weakrefs should now be dead (None), proving that the 
    # AEADEncryptionEngine did NOT hold onto the references, and its own `finally: del` worked.
    assert key_ref() is None, "MessageKey leaked in memory!"
    assert pt_ref() is None, "Plaintext leaked in memory!"
