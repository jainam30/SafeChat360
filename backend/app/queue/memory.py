from typing import Callable, Dict, Any, List
import asyncio
import uuid
import logging
from .provider import QueueProvider

logger = logging.getLogger(__name__)

class MemoryQueue(QueueProvider):
    def __init__(self):
        self._handlers: Dict[str, Callable] = {}
        # In-memory queue storage
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task = None

    def register_worker(self, job_type: str, handler: Callable):
        self._handlers[job_type] = handler
        logger.info(f"Registered MemoryQueue worker for job: {job_type}")
        
    async def enqueue(self, job_type: str, payload: Any) -> str:
        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "type": job_type,
            "payload": payload
        }
        await self._queue.put(job)
        logger.debug(f"Enqueued job {job_id} of type {job_type}")
        
        # Start worker if not already running (for development simplicity)
        if not self._worker_task or self._worker_task.done():
             self._worker_task = asyncio.create_task(self._process_queue())
             
        return job_id

    async def _process_queue(self):
        while not self._queue.empty():
            job = await self._queue.get()
            job_type = job["type"]
            handler = self._handlers.get(job_type)
            
            if handler:
                try:
                    logger.info(f"Processing job {job['id']} of type {job_type}")
                    if asyncio.iscoroutinefunction(handler):
                        await handler(job["payload"])
                    else:
                        handler(job["payload"])
                except Exception as e:
                    logger.error(f"Job {job['id']} failed: {str(e)}")
            else:
                logger.warning(f"No handler registered for job type: {job_type}")
                
            self._queue.task_done()
