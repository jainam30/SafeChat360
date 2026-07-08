import os
import uuid
import secrets

class SecureRandomService:
    """
    Provides secure random generation for cryptographic operations.
    """
    @staticmethod
    def random_bytes(num_bytes: int) -> bytes:
        return os.urandom(num_bytes)

    @staticmethod
    def random_identifier() -> str:
        return str(uuid.uuid4())

    @staticmethod
    def generate_nonce(size: int = 12) -> bytes:
        return os.urandom(size)

    @staticmethod
    def generate_iv(size: int = 16) -> bytes:
        return os.urandom(size)

    @staticmethod
    def generate_salt(size: int = 32) -> bytes:
        return os.urandom(size)

    @staticmethod
    def random_string(length: int = 32) -> str:
        return secrets.token_urlsafe(length)
