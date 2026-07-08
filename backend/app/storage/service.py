from typing import BinaryIO, List
from .provider import StorageProvider
from app.core.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self, provider: StorageProvider):
        self.provider = provider
        # Defaults
        self.max_size_bytes = 10 * 1024 * 1024  # 10MB
        self.allowed_mime_types = [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/webm",
            "audio/mpeg", "audio/ogg", "audio/wav"
        ]

    def validate_mime_type(self, mime_type: str) -> bool:
        if mime_type not in self.allowed_mime_types:
            raise APIException(status_code=400, detail=f"Unsupported file type: {mime_type}")
        return True

    def validate_file_size(self, size_bytes: int) -> bool:
        if size_bytes > self.max_size_bytes:
            raise APIException(status_code=400, detail=f"File exceeds maximum allowed size of {self.max_size_bytes} bytes")
        return True

    def upload(self, file_obj: BinaryIO, path: str, content_type: str, file_size: int = 0) -> str:
        self.validate_mime_type(content_type)
        if file_size > 0:
            self.validate_file_size(file_size)
            
        logger.info(f"StorageService: Uploading file {path}")
        return self.provider.upload(file_obj, path, content_type)

    def download(self, path: str) -> BinaryIO:
        return self.provider.download(path)

    def delete(self, path: str) -> bool:
        logger.info(f"StorageService: Deleting file {path}")
        return self.provider.delete(path)

    def generate_signed_url(self, path: str, expires_in_seconds: int = 3600) -> str:
        return self.provider.generate_signed_url(path, expires_in_seconds)
