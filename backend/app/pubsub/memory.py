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
        handlers = self._subscriptions.get(channel, [])
        if not handlers:
            return
            
        # Fire handlers concurrently
        tasks = [asyncio.create_task(handler(message)) for handler in handlers]
        
        # We don't necessarily want to wait for all handlers to finish before returning
        # to the publisher, but we can do a gather with return_exceptions=True
        # to ensure they are scheduled.
        asyncio.gather(*tasks, return_exceptions=True)

    async def subscribe(self, channel: str, handler: Callable[[str], Awaitable[None]]) -> None:
        if channel not in self._subscriptions:
            self._subscriptions[channel] = []
        self._subscriptions[channel].append(handler)
        logger.debug(f"Subscribed to MemoryPubSub channel: {channel}")

    async def unsubscribe(self, channel: str) -> None:
        if channel in self._subscriptions:
            del self._subscriptions[channel]
            logger.debug(f"Unsubscribed from MemoryPubSub channel: {channel}")
