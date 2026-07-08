from abc import ABC, abstractmethod
from typing import Dict, Any, List

class CryptographicIdentity(ABC):
    """
    Represents a user's cryptographic identity for E2EE.
    """
    @property
    @abstractmethod
    def identity_key(self) -> str:
        """The long-term public identity key."""
        pass

    @property
    @abstractmethod
    def signed_pre_key(self) -> str:
        """The signed pre-key rotated periodically."""
        pass

    @property
    @abstractmethod
    def one_time_pre_keys(self) -> List[str]:
        """A pool of one-time keys."""
        pass

class KeyStore(ABC):
    """
    Storage abstraction for public key material.
    Private keys must NEVER leave the client.
    """
    @abstractmethod
    def save_identity(self, user_id: int, identity: CryptographicIdentity):
        pass

    @abstractmethod
    def get_identity(self, user_id: int) -> CryptographicIdentity:
        pass
