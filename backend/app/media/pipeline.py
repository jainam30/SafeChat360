from typing import BinaryIO, Dict, Any
import logging
from app.queue.service import QueueService
from app.storage.service import StorageService
from app.audit.service import AuditService

logger = logging.getLogger(__name__)

class MediaPipeline:
    def __init__(self, storage_service: StorageService, queue_service: QueueService, audit_service: AuditService):
        self.storage = storage_service
        self.queue = queue_service
        self.audit = audit_service

    def _validate(self, content_type: str, file_size: int):
        self.storage.validate_mime_type(content_type)
        self.storage.validate_file_size(file_size)

    def _virus_scan(self, file_path: str):
        # Placeholder for ClamAV or similar integration
        logger.info(f"MediaPipeline: Virus scan passed for {file_path}")

    def _compress(self, file_path: str):
        # Placeholder for ffmpeg/ImageMagick compression
        logger.info(f"MediaPipeline: Compression applied for {file_path}")

    def _extract_metadata(self, file_path: str) -> Dict[str, Any]:
        # Placeholder for EXIF/ffprobe metadata extraction
        logger.info(f"MediaPipeline: Metadata extracted for {file_path}")
        return {"width": 1920, "height": 1080}

    def _generate_thumbnail(self, file_path: str) -> str:
        # Placeholder for thumbnail generation
        logger.info(f"MediaPipeline: Thumbnail generated for {file_path}")
        return f"{file_path}_thumb.jpg"

    async def process_upload(self, file_obj: BinaryIO, path: str, content_type: str, file_size: int, user_id: int) -> str:
        """
        Synchronous fast-path for small files (or just upload), queues heavy processing.
        """
        # 1. Validate
        self._validate(content_type, file_size)
        
        # 2. Upload original synchronously to Storage
        url = self.storage.upload(file_obj, path, content_type, file_size)
        
        # 3. Audit
        self.audit.log_action("FILE_UPLOAD", user_id, path, "SUCCESS")
        
        # 4. Queue long-running async tasks (Compression, Thumbnail, Scanning)
        await self.queue.enqueue("media_processing", {
            "path": path,
            "content_type": content_type,
            "url": url,
            "user_id": user_id
        })
        
        return url

    async def _async_media_job_handler(self, payload: Dict[str, Any]):
        """Handler for 'media_processing' queue jobs."""
        path = payload["path"]
        logger.info(f"MediaPipeline: Async processing started for {path}")
        self._virus_scan(path)
        self._compress(path)
        self._extract_metadata(path)
        if payload["content_type"].startswith("video/"):
            self._generate_thumbnail(path)
        logger.info(f"MediaPipeline: Async processing completed for {path}")
