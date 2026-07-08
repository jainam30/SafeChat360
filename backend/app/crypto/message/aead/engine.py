import logging
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from .interfaces import IAEADEncryptionEngine
from .models import EncryptedMessage
from app.crypto.double_ratchet.headers.models import MessageHeader
from .aad import AssociatedDataBuilder
from .nonce import NonceGenerator

logger = logging.getLogger(__name__)

class AEADEncryptionEngine(IAEADEncryptionEngine):
    """
    Encrypts a plaintext payload using AES-256-GCM.
    Authenticates the MessageHeader using the AAD parameter.
    """
    
    def __init__(self):
        self.aad_builder = AssociatedDataBuilder()
        self.nonce_gen = NonceGenerator()

    def encrypt(self, message_key: bytes, plaintext: bytes, header: MessageHeader) -> EncryptedMessage:
        if not message_key or len(message_key) != 32:
            raise ValueError("AES-256-GCM requires exactly a 32-byte MessageKey.")
            
        logger.info(f"Initiating AEAD Encryption for Session: {header.session_id}")
        
        try:
            # 1. Prepare Cryptographic Inputs
            nonce = self.nonce_gen.generate()
            aad = self.aad_builder.build(header)
            
            # 2. Initialize Cipher
            aesgcm = AESGCM(message_key)
            
            # 3. Encrypt and Authenticate
            # AESGCM.encrypt() returns the ciphertext with the 16-byte MAC appended.
            # We slice it to decouple the ciphertext from the authentication_tag.
            encrypted_data = aesgcm.encrypt(nonce, plaintext, aad)
            
            ciphertext = encrypted_data[:-16]
            auth_tag = encrypted_data[-16:]
            
            # 4. Construct Immutable EncryptedMessage
            encrypted_msg = EncryptedMessage(
                header=header,
                nonce=nonce,
                ciphertext=ciphertext,
                authentication_tag=auth_tag,
                session_id=header.session_id
            )
            
            logger.info("AEAD Encryption successful. Header authenticated.")
            return encrypted_msg
            
        except Exception as e:
            logger.error(f"AEAD Encryption failed: {e}")
            raise RuntimeError(f"Encryption Failure: {e}")
            
        finally:
            # Zeroize sensitive materials from Python memory references
            del message_key
            del plaintext
