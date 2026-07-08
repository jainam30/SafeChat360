from abc import ABC, abstractmethod
from typing import Optional
from app.crypto.message.aead.models import EncryptedMessage

class ISecureSession(ABC):
    """
    Public interface for a Secure Session. 
    Strictly encapsulates all cryptographic keys and state machines.
    """
    
    @abstractmethod
    def encrypt_message(self, plaintext_payload: str) -> EncryptedMessage:
        pass
        
    @abstractmethod
    def decrypt_message(self, encrypted_message: EncryptedMessage) -> str:
        pass
        
    @abstractmethod
    def close(self) -> None:
        pass
        
    @abstractmethod
    def destroy(self) -> None:
        pass
