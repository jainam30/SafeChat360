import pytest
import os
from app.crypto.double_ratchet.headers.models import MessageHeader
from app.crypto.message.aead.engine import AEADEncryptionEngine
from app.crypto.message.aead.decryption import AEADDecryptionEngine

@pytest.fixture
def message_key():
    return os.urandom(32)

@pytest.fixture
def mock_header():
    return MessageHeader(
        header_uuid="uuid_123_dec",
        protocol_version="1.0",
        session_id="sess_aead_dec",
        sender_device_id="dev_a",
        ratchet_public_key="ALICE_PUB",
        previous_chain_length=0,
        message_number=1
    )

@pytest.fixture
def encrypted_payload(message_key, mock_header):
    engine = AEADEncryptionEngine()
    plaintext = b"Top secret SafeChat message"
    return engine.encrypt(message_key, plaintext, mock_header)

def test_aead_decryption_success(message_key, encrypted_payload):
    dec_engine = AEADDecryptionEngine()
    
    plaintext_msg = dec_engine.decrypt(message_key, encrypted_payload)
    
    assert plaintext_msg is not None
    assert plaintext_msg.session_id == encrypted_payload.session_id
    assert plaintext_msg.message_uuid == encrypted_payload.message_uuid
    assert plaintext_msg.plaintext == b"Top secret SafeChat message"

def test_aead_decryption_wrong_key(encrypted_payload):
    dec_engine = AEADDecryptionEngine()
    wrong_key = os.urandom(32)
    
    with pytest.raises(ValueError, match="Decryption aborted: Authentication failed"):
        dec_engine.decrypt(wrong_key, encrypted_payload)

def test_aead_decryption_tampered_header(message_key, encrypted_payload):
    dec_engine = AEADDecryptionEngine()
    
    # Tamper with the header's message number
    tampered_header = encrypted_payload.header.model_copy(update={"message_number": 999})
    tampered_msg = encrypted_payload.model_copy(update={"header": tampered_header})
    
    # Because AAD is mathematically bound to the MAC, changing the header breaks authentication
    with pytest.raises(ValueError, match="Decryption aborted: Authentication failed"):
        dec_engine.decrypt(message_key, tampered_msg)

def test_aead_decryption_tampered_ciphertext(message_key, encrypted_payload):
    dec_engine = AEADDecryptionEngine()
    
    # Flip a bit in the ciphertext
    tampered_cipher = bytearray(encrypted_payload.ciphertext)
    if len(tampered_cipher) > 0:
        tampered_cipher[0] ^= 0x01
        
    tampered_msg = encrypted_payload.model_copy(update={"ciphertext": bytes(tampered_cipher)})
    
    with pytest.raises(ValueError, match="Decryption aborted: Authentication failed"):
        dec_engine.decrypt(message_key, tampered_msg)

def test_aead_decryption_tampered_tag(message_key, encrypted_payload):
    dec_engine = AEADDecryptionEngine()
    
    # Flip a bit in the authentication tag
    tampered_tag = bytearray(encrypted_payload.authentication_tag)
    tampered_tag[0] ^= 0x01
        
    tampered_msg = encrypted_payload.model_copy(update={"authentication_tag": bytes(tampered_tag)})
    
    with pytest.raises(ValueError, match="Decryption aborted: Authentication failed"):
        dec_engine.decrypt(message_key, tampered_msg)

def test_aead_decryption_invalid_header_structure(message_key, encrypted_payload):
    dec_engine = AEADDecryptionEngine()
    
    # Break the strict validator rules
    tampered_header = encrypted_payload.header.model_copy(update={"message_number": -5})
    tampered_msg = encrypted_payload.model_copy(update={"header": tampered_header})
    
    with pytest.raises(ValueError, match="Header failed structural validation"):
        dec_engine.decrypt(message_key, tampered_msg)

def test_1000_sequential_decryptions(message_key, mock_header):
    enc_engine = AEADEncryptionEngine()
    dec_engine = AEADDecryptionEngine()
    
    plaintext = b"Fast payload"
    
    for i in range(1000):
        header = mock_header.model_copy(update={"message_number": i})
        enc = enc_engine.encrypt(message_key, plaintext, header)
        
        dec = dec_engine.decrypt(message_key, enc)
        assert dec.plaintext == plaintext
