import logging
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from .interfaces import IAEADDecryptionEngine
from .models import EncryptedMessage, PlaintextMessage
from .aad import AssociatedDataBuilder
from app.crypto.double_ratchet.headers.validator import HeaderValidator

logger = logging.getLogger(__name__)

class AEADDecryptionEngine(IAEADDecryptionEngine):
    """
    Safely decrypts an EncryptedMessage using AES-256-GCM.
    Enforces the "Authenticate First, Decrypt Second" paradigm.
    """
    
    def __init__(self):
        self.aad_builder = AssociatedDataBuilder()
        self.header_validator = HeaderValidator()

    def decrypt(self, message_key: bytes, encrypted_msg: EncryptedMessage) -> PlaintextMessage:
        if not message_key or len(message_key) != 32:
            raise ValueError("AES-256-GCM requires exactly a 32-byte MessageKey.")
            
        logger.info(f"Initiating AEAD Decryption for Session: {encrypted_msg.session_id}")
        
        # 1. Header Validation (Fast Fail)
        if not self.header_validator.validate(encrypted_msg.header):
            raise ValueError("Decryption aborted: Header failed structural validation.")
        
        try:
            # 2. Reconstruct Associated Data
            aad = self.aad_builder.build(encrypted_msg.header)
            
            # 3. Reconstruct full AES-GCM Ciphertext block (Data + MAC)
            combined_ciphertext = encrypted_msg.ciphertext + encrypted_msg.authentication_tag
            
            # 4. Initialize Cipher
            aesgcm = AESGCM(message_key)
            
            # 5. Authenticate and Decrypt
            # If the header, ciphertext, or tag were tampered with, this function
            # will mathematically fail and raise InvalidTag, returning NO plaintext.
            plaintext = aesgcm.decrypt(
                nonce=encrypted_msg.nonce,
                data=combined_ciphertext,
                associated_data=aad
            )
            
            # 6. Construct Immutable PlaintextMessage
            plaintext_msg = PlaintextMessage(
                session_id=encrypted_msg.session_id,
                message_uuid=encrypted_msg.message_uuid,
                plaintext=plaintext
            )
            
            logger.info("AEAD Decryption successful. Header and payload authenticated.")
            return plaintext_msg
            
        except InvalidTag:
            logger.error("AEAD Decryption failed: Invalid Authentication Tag. Tampering detected.")
            raise ValueError("Decryption aborted: Authentication failed.")
            
        except Exception as e:
            logger.error(f"AEAD Decryption failed: {e}")
            raise RuntimeError(f"Decryption Failure: {e}")
            
        finally:
            # Zeroize the message key reference from memory
            del message_key
