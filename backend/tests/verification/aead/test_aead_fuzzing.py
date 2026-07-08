import pytest
import os
import random
from app.crypto.double_ratchet.headers.models import MessageHeader
from app.crypto.message.aead.engine import AEADEncryptionEngine
from app.crypto.message.aead.decryption import AEADDecryptionEngine

@pytest.fixture
def crypto_materials():
    msg_key = os.urandom(32)
    header = MessageHeader(
        header_uuid="fuzz_uuid",
        protocol_version="1.0",
        session_id="sess_fuzz",
        sender_device_id="dev_a",
        ratchet_public_key="ALICE_PUB",
        previous_chain_length=0,
        message_number=1
    )
    enc_engine = AEADEncryptionEngine()
    encrypted = enc_engine.encrypt(msg_key, b"Fuzz target payload", header)
    return msg_key, encrypted

def test_fuzz_ciphertext(crypto_materials):
    msg_key, encrypted = crypto_materials
    dec_engine = AEADDecryptionEngine()
    
    # Fuzz testing: mutate 1 to 10 random bytes in the ciphertext
    for _ in range(50):
        fuzzed_cipher = bytearray(encrypted.ciphertext)
        num_mutations = random.randint(1, min(10, len(fuzzed_cipher)))
        
        for _ in range(num_mutations):
            idx = random.randint(0, len(fuzzed_cipher) - 1)
            fuzzed_cipher[idx] ^= 0xFF # Flip bits
            
        fuzzed_msg = encrypted.model_copy(update={"ciphertext": bytes(fuzzed_cipher)})
        
        # Property: 100% of fuzzed ciphertexts MUST fail authentication
        with pytest.raises(ValueError, match="Decryption aborted: Authentication failed"):
            dec_engine.decrypt(msg_key, fuzzed_msg)

def test_fuzz_authentication_tag(crypto_materials):
    msg_key, encrypted = crypto_materials
    dec_engine = AEADDecryptionEngine()
    
    for _ in range(50):
        fuzzed_tag = bytearray(encrypted.authentication_tag)
        idx = random.randint(0, 15)
        fuzzed_tag[idx] ^= 0x01
        
        fuzzed_msg = encrypted.model_copy(update={"authentication_tag": bytes(fuzzed_tag)})
        
        with pytest.raises(ValueError, match="Decryption aborted: Authentication failed"):
            dec_engine.decrypt(msg_key, fuzzed_msg)
