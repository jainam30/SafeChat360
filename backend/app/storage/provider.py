from abc import ABC, abstractmethod
from typing import Optional, BinaryIO

class StorageProvider(ABC):
    @abstractmethod
    def upload(self, file_obj: BinaryIO, path: str, content_type: str) -> str:
        """Upload a file and return its public URL or key."""
        pass

    @abstractmethod
    def download(self, path: str) -> BinaryIO:
        """Download a file into a binary stream."""
        pass

    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete a file from storage."""
        pass

    @abstractmethod
    def generate_signed_url(self, path: str, expires_in_seconds: int = 3600) -> str:
        """Generate a temporary signed URL for secure access."""
        pass
