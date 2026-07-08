import logging
from typing import Optional
from .interfaces.secure_session import ISecureSession
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.derivation.symmetric import SymmetricRatchetEngine
from app.crypto.message.aead.engine import AEADEncryptionEngine
from app.crypto.message.aead.decryption import AEADDecryptionEngine
from app.crypto.message.aead.models import EncryptedMessage
from app.crypto.double_ratchet.headers.builder import HeaderBuilder
from app.crypto.double_ratchet.skipped_keys.manager import SkippedKeyManager
from app.crypto.double_ratchet.skipped_keys.repository import InMemorySkippedKeyStore
from cryptography.exceptions import InvalidTag

logger = logging.getLogger(__name__)

class SecureSession(ISecureSession):
    """
    Concrete implementation of ISecureSession.
    Wraps the frozen cryptographic core. Business logic CANNOT access keys through this.
    """
    
    def __init__(self, state: DoubleRatchetState, sender_device_id: str):
        # We hold the active DoubleRatchetState
        self._state = state
        self._sender_device_id = sender_device_id
        
        # Instantiate frozen crypto engines
        self._sym_engine = SymmetricRatchetEngine()
        self._enc_engine = AEADEncryptionEngine()
        self._dec_engine = AEADDecryptionEngine()
        self._header_builder = HeaderBuilder()
        
        # Local skipped key store for inbound out-of-order resolution
        # In a real persistence layer, this store would be injected/shared
        self._skipped_store = InMemorySkippedKeyStore()
        self._skipped_manager = SkippedKeyManager(store=self._skipped_store)

    def encrypt_message(self, plaintext_payload: str) -> EncryptedMessage:
        logger.debug(f"Encrypting outbound payload for session {self._state.session_id}")
        
        # 1. Advance Ratchet
        self._state, msg_key = self._sym_engine.derive_next_sending(self._state)
        
        # 2. Build Header
        header = self._header_builder.build(self._state, self._sender_device_id)
        
        # 3. Encrypt
        encrypted_msg = self._enc_engine.encrypt(msg_key, plaintext_payload.encode('utf-8'), header)
        
        return encrypted_msg

    def decrypt_message(self, encrypted_message: EncryptedMessage) -> str:
        logger.debug(f"Decrypting inbound payload for session {self._state.session_id}")
        
        header = encrypted_message.header
        
        # 1. Process via SkippedKeyManager to handle replays and gaps
        self._state, msg_key = self._skipped_manager.process_incoming(
            self._state, 
            header.message_number, 
            header.ratchet_public_key
        )
        
        if msg_key is None:
            # Replay or already consumed
            if header.message_number < self._state.receiving_message_number:
                logger.warning("Message rejected: Replay detected.")
                raise ValueError("Replay detected.")
            
            # If msg_key is still None but we are aligned, we must derive it
            self._state, msg_key = self._sym_engine.derive_next_receiving(self._state)
            
        # 2. Decrypt & Authenticate
        try:
            plaintext_msg = self._dec_engine.decrypt(msg_key, encrypted_message)
            return plaintext_msg.plaintext.decode('utf-8')
        except Exception as e:
            logger.error(f"Authentication failed during decryption: {e}")
            raise ValueError(f"Authentication failed: {e}")

    def close(self) -> None:
        logger.info(f"Closing session {self._state.session_id}")
        # In a real app, this flushes state to DB

    def destroy(self) -> None:
        logger.warning(f"Destroying session {self._state.session_id}")
        # Wipe state from memory
        self._state = None
