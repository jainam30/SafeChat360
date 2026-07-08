import asyncio
import logging
from typing import List
import time

from .registry import ConnectionRegistry, ConnectionContext
from app.events.bus import EventBus
from app.metrics.service import MetricsService

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages the lifecycle of connections on this node.
    Abstracts direct WebSocket interactions (send/close) to ensure safety.
    """
    def __init__(self, registry: ConnectionRegistry, event_bus: EventBus, metrics: MetricsService):
        self.registry = registry
        self.event_bus = event_bus
        self.metrics = metrics

    async def register(self, ctx: ConnectionContext):
        self.registry.add(ctx)
        self.metrics.increment("active_websocket_connections")
        
        from app.events.types import BaseEvent
        class ConnectionOpenedEvent(BaseEvent):
            event_type = "ConnectionOpened"
            
        await self.event_bus.publish(ConnectionOpenedEvent(
            actor_id=ctx.user_id,
            payload={"device_id": ctx.device_id, "node_id": "local"}
        ))

    async def unregister(self, user_id: int, device_id: str):
        ctx = self.registry.get_by_device(device_id)
        if ctx:
            self.registry.remove(user_id, device_id)
            self.metrics.decrement("active_websocket_connections")
            
            from app.events.types import BaseEvent
            class ConnectionClosedEvent(BaseEvent):
                event_type = "ConnectionClosed"
                
            await self.event_bus.publish(ConnectionClosedEvent(
                actor_id=user_id,
                payload={"device_id": device_id}
            ))

    async def send_to_user(self, user_id: int, payload: str) -> int:
        """Sends a payload to all connected devices for a user on THIS node. Returns successful dispatch count."""
        connections = self.registry.get_by_user(user_id)
        success_count = 0
        for ctx in connections:
            try:
                await ctx.websocket.send_text(payload)
                success_count += 1
            except Exception as e:
                logger.warning(f"Failed to send to user {user_id} device {ctx.device_id}: {e}")
                # We do not unregister here; the heartbeat/cleanup loop will handle dead connections.
        return success_count
        
    async def cleanup_stale_connections(self, timeout_seconds: int = 60):
        """Scans for connections that haven't sent a heartbeat."""
        now = time.time()
        for ctx in self.registry.get_all():
            if now - ctx.last_heartbeat > timeout_seconds:
                logger.info(f"Closing stale connection for user {ctx.user_id} device {ctx.device_id}")
                try:
                    await ctx.websocket.close(code=1000, reason="Heartbeat timeout")
                except:
                    pass
                await self.unregister(ctx.user_id, ctx.device_id)
                self.metrics.increment("stale_connections_dropped")
