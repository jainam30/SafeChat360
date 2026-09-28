from typing import Dict, List, Callable, Awaitable
import asyncio
import logging

from .provider import PubSubProvider

logger = logging.getLogger(__name__)


class MemoryPubSub(PubSubProvider):
    """
    In-memory implementation of the PubSubProvider.
    Suitable for single-node deployments or testing.
    """

    def __init__(self):
        # channel -> list of handlers
        self._subscriptions: Dict[str, List[Callable[[str], Awaitable[None]]]] = {}

    async def publish(self, channel: str, message: str) -> None:
        # Copy the handler list: a handler may unsubscribe (itself) mid-publish.
        handlers = list(self._subscriptions.get(channel, []))
        if not handlers:
            return

        # Fire handlers concurrently
        tasks = [asyncio.create_task(handler(message)) for handler in handlers]
        # Schedule but don't block the publisher on handler completion.
        asyncio.gather(*tasks, return_exceptions=True)

    async def subscribe(self, channel: str, handler: Callable[[str], Awaitable[None]]) -> None:
        if channel not in self._subscriptions:
            self._subscriptions[channel] = []
        if handler not in self._subscriptions[channel]:
            self._subscriptions[channel].append(handler)
        logger.debug(f"Subscribed to MemoryPubSub channel: {channel}")

    async def unsubscribe(self, channel: str, handler: Optional[Callable[[str], Awaitable[None]]] = None) -> None:
        """Remove a specific handler, or the entire channel when handler is None."""
        if channel not in self._subscriptions:
            return
        if handler is None:
            del self._subscriptions[channel]
        else:
            self._subscriptions[channel] = [h for h in self._subscriptions[channel] if h is not handler]
            if not self._subscriptions[channel]:
                del self._subscriptions[channel]
        logger.debug(f"Unsubscribed from MemoryPubSub channel: {channel}")
