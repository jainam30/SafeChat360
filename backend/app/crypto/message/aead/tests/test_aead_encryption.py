import pytest
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.crypto.double_ratchet.headers.models import MessageHeader
from app.crypto.message.aead.engine import AEADEncryptionEngine
from app.crypto.message.aead.aad import AssociatedDataBuilder

@pytest.fixture
def mock_header():
    return MessageHeader(
        header_uuid="uuid_123",
        protocol_version="1.0",
        session_id="sess_aead",
        sender_device_id="dev_a",
        ratchet_public_key="ALICE_PUB",
        previous_chain_length=0,
        message_number=1
    )

def test_aead_encryption_success(mock_header):
    engine = AEADEncryptionEngine()
    message_key = os.urandom(32)
    plaintext = b"Top secret SafeChat message"
    
    encrypted_msg = engine.encrypt(message_key, plaintext, mock_header)
    
    assert encrypted_msg is not None
    assert encrypted_msg.session_id == "sess_aead"
    assert len(encrypted_msg.nonce) == 12
    assert len(encrypted_msg.authentication_tag) == 16
    assert len(encrypted_msg.ciphertext) == len(plaintext)
    
    # Verify we can decrypt it natively with AESGCM
    aesgcm = AESGCM(message_key)
    aad_builder = AssociatedDataBuilder()
    aad = aad_builder.build(mock_header)
    
    # Reassemble ciphertext + tag for decryption
    combined_ciphertext = encrypted_msg.ciphertext + encrypted_msg.authentication_tag
    decrypted = aesgcm.decrypt(encrypted_msg.nonce, combined_ciphertext, aad)
    
    assert decrypted == plaintext

def test_aead_tampered_header_authentication(mock_header):
    engine = AEADEncryptionEngine()
    message_key = os.urandom(32)
    plaintext = b"Payload"
    
    encrypted_msg = engine.encrypt(message_key, plaintext, mock_header)
    
    # Tamper with the header locally
    tampered_header = mock_header.model_copy(update={"message_number": 999})
    
    aesgcm = AESGCM(message_key)
    aad_builder = AssociatedDataBuilder()
    tampered_aad = aad_builder.build(tampered_header)
    
    combined_ciphertext = encrypted_msg.ciphertext + encrypted_msg.authentication_tag
    
    # Decryption should raise an InvalidTag exception
    from cryptography.exceptions import InvalidTag
    with pytest.raises(InvalidTag):
        aesgcm.decrypt(encrypted_msg.nonce, combined_ciphertext, tampered_aad)

def test_1000_sequential_encryptions(mock_header):
    engine = AEADEncryptionEngine()
    message_key = os.urandom(32)
    plaintext = b"Repeated payload"
    
    nonces = set()
    
    for _ in range(1000):
        # Even with the same MessageKey and Plaintext, the Nonce must be unique
        enc = engine.encrypt(message_key, plaintext, mock_header)
        nonces.add(enc.nonce)
        
    assert len(nonces) == 1000
