from abc import ABC, abstractmethod
from typing import Callable, Any

class QueueProvider(ABC):
    @abstractmethod
    async def enqueue(self, job_type: str, payload: Any) -> str:
        """Enqueue a job and return its ID."""
        pass

    @abstractmethod
    def register_worker(self, job_type: str, handler: Callable):
        """Register a handler function for a specific job type."""
        pass
