from abc import ABC, abstractmethod
from typing import Optional
from .models import SkippedKeyRecord

class ISkippedKeyStore(ABC):
    @abstractmethod
    def store(self, record: SkippedKeyRecord) -> None:
        pass
        
    @abstractmethod
    def consume(self, session_id: str, ratchet_public_key: str, message_number: int) -> Optional[bytes]:
        """
        Retrieves the key AND deletes it from the store in a single atomic operation.
        """
        pass
        
    @abstractmethod
    def count(self) -> int:
        pass
        
    @abstractmethod
    def cleanup_expired(self, max_age_seconds: int) -> int:
        pass
