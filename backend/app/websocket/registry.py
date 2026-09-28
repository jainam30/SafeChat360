from typing import Dict, List, Set, Optional, Callable, Awaitable
from fastapi import WebSocket
import time
import logging

logger = logging.getLogger(__name__)


class ConnectionContext:
    """Holds metadata and state for a single WebSocket connection."""

    def __init__(self, websocket: WebSocket, user_id: int, device_id: str):
        self.websocket = websocket
        self.user_id = user_id
        self.device_id = device_id
        self.connected_at = time.time()
        self.last_heartbeat = time.time()
        self.average_latency_ms = 0.0
        # Pub/sub bridging (set by GatewayService on accept)
        self.pubsub_channel: Optional[str] = None
        self.pubsub_handler: Optional[Callable[[str], Awaitable[None]]] = None


class ConnectionRegistry:
    """
    In-memory registry of active connections on THIS specific node.
    In a fully distributed system, this node only knows about connections terminated here,
    while presence/pubsub broadcasts handle inter-node routing.
    """

    def __init__(self):
        # Mapping: user_id -> List[ConnectionContext]
        self._user_connections: Dict[int, List[ConnectionContext]] = {}
        # Mapping: device_id -> ConnectionContext
        self._device_connections: Dict[str, ConnectionContext] = {}
        self._total_connections = 0

    def add(self, ctx: ConnectionContext):
        if ctx.user_id not in self._user_connections:
            self._user_connections[ctx.user_id] = []
        self._user_connections[ctx.user_id].append(ctx)
        self._device_connections[ctx.device_id] = ctx
        self._total_connections += 1
        logger.debug(f"Registered connection for user {ctx.user_id}, device {ctx.device_id}")

    def remove(self, user_id: int, device_id: str):
        if device_id in self._device_connections:
            del self._device_connections[device_id]
            self._total_connections -= 1

        if user_id in self._user_connections:
            self._user_connections[user_id] = [
                c for c in self._user_connections[user_id] if c.device_id != device_id
            ]
            if not self._user_connections[user_id]:
                del self._user_connections[user_id]

    def get_by_user(self, user_id: int) -> List[ConnectionContext]:
        return self._user_connections.get(user_id, [])

    def get_by_device(self, device_id: str) -> Optional[ConnectionContext]:
        return self._device_connections.get(device_id)

    def get_online_user_ids(self) -> List[int]:
        """All user ids with at least one live connection on this node."""
        return list(self._user_connections.keys())

    def get_all(self) -> List[ConnectionContext]:
        return list(self._device_connections.values())

    @property
    def total_count(self) -> int:
        return self._total_connections
