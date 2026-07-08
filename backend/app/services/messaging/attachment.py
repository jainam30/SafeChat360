from typing import List, Dict, Any
import logging
from app.storage.service import StorageService
from app.queue.service import QueueService
from app.audit.service import AuditService
from .entity import MessageEntity

logger = logging.getLogger(__name__)

class AttachmentHandler:
    def __init__(self, storage_service: StorageService, queue_service: QueueService, audit_service: AuditService):
        self.storage = storage_service
        self.queue = queue_service
        self.audit = audit_service

    async def process_attachments(self, message: MessageEntity) -> MessageEntity:
        """
        Validates attachments, extracts metadata, and dispatches to queue.
        Assumes attachments array has dicts with 'path', 'content_type', 'size'.
        """
        if not message.attachments:
            return message

        for attachment in message.attachments:
            content_type = attachment.get("content_type", "")
            size = attachment.get("size", 0)
            
            # 1. Validation
            try:
                self.storage.validate_mime_type(content_type)
                self.storage.validate_file_size(size)
            except Exception as e:
                message._is_valid = False
                message._validation_errors.append(f"Attachment error: {str(e)}")
                continue

            # 2. Audit
            self.audit.log_action("MESSAGE_ATTACHMENT", message.sender_id, attachment.get("path"), "SUCCESS")

            # 3. Queue metadata extraction / compression
            await self.queue.enqueue("media_processing", {
                "path": attachment.get("path"),
                "content_type": content_type,
                "message_id": message.id
            })

            # 4. Extract basic metadata synchronously
            attachment["status"] = "processing"
            attachment["url"] = self.storage.generate_signed_url(attachment.get("path", ""))

        return message
