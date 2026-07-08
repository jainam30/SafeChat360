from abc import ABC, abstractmethod
from typing import List, Optional
from ..keys.models import IdentityKey, SignedPreKey, OneTimePreKey

class KeyStore(ABC):
    """
    Interface for key storage and retrieval.
    Designed to support client-managed private keys (server only sees public keys).
    """
    @abstractmethod
    def store_identity_key(self, user_id: int, device_id: str, key: IdentityKey) -> None:
        pass

    @abstractmethod
    def get_identity_key(self, user_id: int, device_id: str) -> Optional[IdentityKey]:
        pass

    @abstractmethod
    def store_signed_prekey(self, user_id: int, device_id: str, key: SignedPreKey) -> None:
        pass

    @abstractmethod
    def get_signed_prekey(self, user_id: int, device_id: str) -> Optional[SignedPreKey]:
        pass

    @abstractmethod
    def store_onetime_prekeys(self, user_id: int, device_id: str, keys: List[OneTimePreKey]) -> None:
        pass

    @abstractmethod
    def get_onetime_prekey(self, user_id: int, device_id: str) -> Optional[OneTimePreKey]:
        pass

    @abstractmethod
    def revoke_device_keys(self, user_id: int, device_id: str) -> None:
        pass
