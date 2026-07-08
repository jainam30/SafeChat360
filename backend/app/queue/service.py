from typing import Any, Callable
from .provider import QueueProvider
import logging

logger = logging.getLogger(__name__)

class QueueService:
    def __init__(self, provider: QueueProvider):
        self.provider = provider
        
    async def enqueue(self, job_type: str, payload: Any) -> str:
        """
        Supported job_types (conventions):
        - email
        - notification
        - ai_processing
        - media_processing
        - cleanup
        """
        logger.info(f"QueueService: Enqueuing {job_type}")
        return await self.provider.enqueue(job_type, payload)

    def register_worker(self, job_type: str, handler: Callable):
        self.provider.register_worker(job_type, handler)
