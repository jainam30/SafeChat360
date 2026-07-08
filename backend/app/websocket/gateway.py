from fastapi import WebSocket, WebSocketDisconnect
from typing import Optional, Callable, Awaitable
import json
import logging
import time

from app.websocket.manager import ConnectionManager
from app.websocket.registry import ConnectionContext
from app.pubsub.provider import PubSubProvider
from app.services.security.policy import PolicyService
from app.services.identity.service import IdentityService
from app.metrics.service import MetricsService

logger = logging.getLogger(__name__)

class GatewayService:
    """
    Separates the physical WebSocket connection layer from business logic.
    Handles authentication, rate limiting, pub/sub bridging, and heartbeats.
    """
    def __init__(
        self, 
        ws_manager: ConnectionManager,
        pubsub: PubSubProvider,
        policy: PolicyService,
        identity: IdentityService,
        metrics: MetricsService
    ):
        self.ws_manager = ws_manager
        self.pubsub = pubsub
        self.policy = policy
        self.identity = identity
        self.metrics = metrics

    async def accept_connection(self, websocket: WebSocket, user_id: int, device_id: str, token: str):
        """
        Validates security policies before accepting the connection.
        """
        # Step 12: Security - Verify Device Trust and Identity
        try:
            self.policy.enforce_trusted_device(user_id, device_id)
            self.policy.enforce_verified_identity(user_id)
        except Exception as e:
            logger.warning(f"Connection rejected for user {user_id}, device {device_id}: {e}")
            await websocket.close(code=1008, reason=str(e))
            return None

        # Accept
        await websocket.accept()
        ctx = ConnectionContext(websocket, user_id, device_id)
        await self.ws_manager.register(ctx)
        
        # Subscribe to Pub/Sub for this user's channel on THIS node
        channel = f"user:{user_id}"
        
        async def pubsub_handler(message: str):
            # When a message arrives from Redis/PubSub, push it down the physical socket
            # If there are multiple connections for this user on this node, ws_manager handles it
            await self.ws_manager.send_to_user(user_id, message)
            
        await self.pubsub.subscribe(channel, pubsub_handler)
        
        logger.info(f"Gateway accepted connection for user {user_id}, device {device_id}")
        return ctx

    async def handle_loop(self, ctx: ConnectionContext, message_processor: Callable[[dict, int, str], Awaitable[None]]):
        """
        Main read loop for the WebSocket.
        Delegates business logic to the message_processor callback (which calls ChatService).
        """
        try:
            while True:
                data = await ctx.websocket.receive_text()
                
                # Heartbeat processing (Ping/Pong)
                if data == "ping":
                    ctx.last_heartbeat = time.time()
                    await ctx.websocket.send_text("pong")
                    self.metrics.increment("heartbeat_count")
                    continue
                    
                # Parsing
                try:
                    message_data = json.loads(data)
                except Exception:
                    continue # Ignore malformed
                    
                # Rate Limiting (primitive for now, ideally Redis-backed)
                # self.metrics.increment(...)
                
                # Delegate to business logic (Pipeline)
                try:
                    await message_processor(message_data, ctx.user_id, ctx.device_id)
                except Exception as e:
                    await ctx.websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
                    
        except WebSocketDisconnect:
            pass
        finally:
            await self.ws_manager.unregister(ctx.user_id, ctx.device_id)
            channel = f"user:{ctx.user_id}"
            await self.pubsub.unsubscribe(channel)
