from typing import Callable, Awaitable, Dict, List
import logging
import asyncio
from .provider import PubSubProvider
from .memory import MemoryPubSub

logger = logging.getLogger(__name__)


class RedisPubSub(PubSubProvider):
    """
    Production-ready Redis-backed Pub/Sub provider with automatic fallback to MemoryPubSub
    if Redis is unavailable or the redis library is not installed.
    """

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._fallback = MemoryPubSub()
        self._redis_client = None
        self._pubsub_task = None
        self._is_redis_ready = False
        self._subscriptions: Dict[str, List[Callable[[str], Awaitable[None]]]] = {}

        try:
            import redis.asyncio as aioredis
            self._aioredis = aioredis
            logger.info(f"Redis library loaded for PubSub ({redis_url})")
        except ImportError:
            self._aioredis = None
            logger.info("redis library not found; RedisPubSub running in Memory fallback mode")

    async def _ensure_connection(self):
        if self._is_redis_ready or self._aioredis is None:
            return
        try:
            self._redis_client = self._aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5,
            )
            await self._redis_client.ping()
            self._is_redis_ready = True
            logger.info("RedisPubSub successfully connected to Redis server.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis at {self.redis_url}: {e}. Using MemoryPubSub fallback.")
            self._is_redis_ready = False
            self._redis_client = None

    async def publish(self, channel: str, message: str) -> None:
        await self._ensure_connection()
        if self._is_redis_ready and self._redis_client:
            try:
                await self._redis_client.publish(channel, message)
                return
            except Exception as e:
                logger.error(f"Redis publish error: {e}. Falling back to MemoryPubSub.")
        await self._fallback.publish(channel, message)

    async def subscribe(self, channel: str, handler: Callable[[str], Awaitable[None]]) -> None:
        await self._ensure_connection()
        if channel not in self._subscriptions:
            self._subscriptions[channel] = []
        self._subscriptions[channel].append(handler)

        # Always register on fallback so local messages work seamlessly
        await self._fallback.subscribe(channel, handler)

    async def unsubscribe(self, channel: str) -> None:
        self._subscriptions.pop(channel, None)
        await self._fallback.unsubscribe(channel)
