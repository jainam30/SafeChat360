import logging
from typing import Optional
from app.messaging.models.messages import OutboundMessage, InboundMessage
from app.messaging.validators.message_validator import MessageValidator
from app.messaging.sessions.session_manager import SessionManager
from app.crypto.message.aead.models import EncryptedMessage

logger = logging.getLogger(__name__)

class SecureMessagingService:
    """
    The main entry point for the application to send and receive secure messages.
    Completely encapsulates all cryptographic operations.
    """
    
    def __init__(self, session_manager: SessionManager):
        self.session_manager = session_manager

    def send_message(self, message: OutboundMessage) -> Optional[EncryptedMessage]:
        """
        Encrypts an outbound message for a specific session.
        """
        if not MessageValidator.validate_outbound(message):
            return None
            
        session = self.session_manager.load_session(message.session_id)
        if not session:
            logger.error(f"Cannot send message. Session {message.session_id} not found.")
            return None
            
        try:
            encrypted = session.encrypt_message(message.plaintext_payload)
            logger.info(f"Successfully encrypted outbound message for session {message.session_id}")
            return encrypted
        except Exception as e:
            logger.error(f"Failed to encrypt message: {e}")
            return None

    def receive_message(self, encrypted_message: EncryptedMessage, sender_id: str) -> Optional[InboundMessage]:
        """
        Decrypts an inbound encrypted message.
        """
        session = self.session_manager.load_session(encrypted_message.session_id)
        if not session:
            logger.error(f"Cannot receive message. Session {encrypted_message.session_id} not found.")
            return None
            
        try:
            plaintext = session.decrypt_message(encrypted_message)
            
            inbound = InboundMessage(
                sender_id=sender_id,
                session_id=encrypted_message.session_id,
                plaintext_payload=plaintext
            )
            
            logger.info(f"Successfully decrypted inbound message from {sender_id}")
            return inbound
        except ValueError as e:
            # Captures Authentication/Replay failures
            logger.warning(f"Inbound message rejected: {e}")
            return None
        except Exception as e:
            logger.error(f"Critical failure decrypting inbound message: {e}")
            return None
