from abc import ABC, abstractmethod
from typing import Tuple
from .models import EncryptedMessage
from app.crypto.double_ratchet.headers.models import MessageHeader

class IAssociatedDataBuilder(ABC):
    @abstractmethod
    def build(self, header: MessageHeader) -> bytes:
        pass

class INonceGenerator(ABC):
    @abstractmethod
    def generate(self) -> bytes:
        pass

class IAEADEncryptionEngine(ABC):
    @abstractmethod
    def encrypt(self, message_key: bytes, plaintext: bytes, header: MessageHeader) -> EncryptedMessage:
        pass

class IAEADDecryptionEngine(ABC):
    @abstractmethod
    def decrypt(self, message_key: bytes, encrypted_msg: EncryptedMessage) -> 'PlaintextMessage':
        pass
