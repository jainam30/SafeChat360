from abc import ABC, abstractmethod

class CryptoProvider(ABC):
    """
    Core interface for cryptographic operations.
    Allows swapping implementations without affecting business logic.
    """
    @abstractmethod
    def generate_random_bytes(self, num_bytes: int) -> bytes:
        pass

    @abstractmethod
    def generate_key_pair(self) -> tuple[bytes, bytes]:
        pass

    @abstractmethod
    def hash_data(self, data: bytes) -> bytes:
        pass

    @abstractmethod
    def sign_message(self, private_key: bytes, message: bytes) -> bytes:
        pass
        
    @abstractmethod
    def verify_signature(self, public_key: bytes, message: bytes, signature: bytes) -> bool:
        pass

    @abstractmethod
    def encrypt_authenticated(self, key: bytes, plaintext: bytes) -> tuple[bytes, bytes, bytes]:
        pass

    @abstractmethod
    def decrypt_authenticated(self, key: bytes, ciphertext: bytes, nonce: bytes, tag: bytes) -> bytes:
        pass

    @abstractmethod
    def derive_key(self, secret: bytes, salt: bytes, info: bytes) -> bytes:
        pass
