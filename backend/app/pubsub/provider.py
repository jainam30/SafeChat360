from abc import ABC, abstractmethod
from typing import Callable, Awaitable, Any, Optional

class PubSubProvider(ABC):
    """
    Abstract interface for distributed Pub/Sub mechanisms.
    This allows swapping MemoryPubSub for RedisPubSub, NATS, etc. without business logic changes.
    """
    
    @abstractmethod
    async def publish(self, channel: str, message: str) -> None:
        """Publishes a string payload to a specific channel."""
        pass

    @abstractmethod
    async def subscribe(self, channel: str, handler: Callable[[str], Awaitable[None]]) -> None:
        """Registers an async callback for messages on a specific channel."""
        pass

    @abstractmethod
    async def unsubscribe(self, channel: str, handler: Optional[Callable[[str], Awaitable[None]]] = None) -> None:
        """Removes a specific handler, or the entire channel when handler is None."""
        pass
