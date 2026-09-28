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
from app.utils.security import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

logger = logging.getLogger(__name__)


def verify_ws_token(token: Optional[str]) -> Optional[int]:
    """
    Validates a JWT and returns the authenticated user id, or None.
    Accepts the "sub" claim issued by SessionService (legacy "email" tokens rejected
    here because WS identity must map to a concrete user id).
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], audience="safechat360-clients")
        subject = payload.get("sub")
        if subject is None:
            return None
        return int(subject)
    except (JWTError, TypeError, ValueError):
        return None


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
        metrics: MetricsService,
    ):
        self.ws_manager = ws_manager
        self.pubsub = pubsub
        self.policy = policy
        self.identity = identity
        self.metrics = metrics

    async def accept_connection(
        self,
        websocket: WebSocket,
        user_id: int,
        device_id: str,
        token: str,
        *,
        skip_device_policy: bool = False,
    ):
        """
        Authenticates (JWT must map to the same user as client_id), applies
        security policies, then registers the connection and pub/sub bridging.

        Returns a ConnectionContext on success, or None if rejected.
        """
        # Step 1: Authentication - the token is the source of truth. The URL's
        # client_id is untrusted; a mismatch means impersonation.
        token_user_id = verify_ws_token(token)
        if token_user_id is None:
            logger.warning(f"WS rejected: missing/invalid token (claimed user {user_id})")
            await websocket.close(code=4001, reason="Unauthorized")
            return None
        if token_user_id != user_id:
            logger.warning(f"WS rejected: token user {token_user_id} != requested user {user_id}")
            await websocket.close(code=4003, reason="User mismatch")
            return None

        # Step 2: Security policies. Device/identity policies are only enforced
        # when the caller explicitly opts in; by default a valid JWT is sufficient
        # (device_id from query params is not a trustworthy signal).
        if not skip_device_policy:
            try:
                self.policy.enforce_trusted_device(user_id, device_id)
                self.policy.enforce_verified_identity(user_id)
            except Exception as e:
                logger.warning(f"Connection rejected for user {user_id}, device {device_id}: {e}")
                await websocket.close(code=1008, reason=str(e))
                return None

        # Step 3: Accept + register
        await websocket.accept()
        ctx = ConnectionContext(websocket, user_id, device_id)
        await self.ws_manager.register(ctx)

        # Step 4: Subscribe to the user's Pub/Sub channel with a dedicated handler
        # so we can remove exactly this connection's subscription on disconnect.
        channel = f"user:{user_id}"

        async def pubsub_handler(message: str) -> None:
            await self.ws_manager.send_to_user(user_id, message)

        ctx.pubsub_channel = channel
        ctx.pubsub_handler = pubsub_handler
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
                    continue  # Ignore malformed

                # Delegate to business logic (Pipeline)
                try:
                    await message_processor(message_data, ctx.user_id, ctx.device_id)
                except Exception as e:
                    await ctx.websocket.send_text(json.dumps({"type": "error", "message": str(e)}))

        except WebSocketDisconnect:
            pass
        finally:
            await self.ws_manager.unregister(ctx.user_id, ctx.device_id)
            # Remove exactly this connection's pub/sub handler, not the whole
            # channel (other tabs/devices of the same user may still be live).
            try:
                await self.pubsub.unsubscribe(getattr(ctx, "pubsub_channel", f"user:{ctx.user_id}"), getattr(ctx, "pubsub_handler", None))
            except Exception as e:
                logger.warning(f"Pubsub unsubscribe failed for user {ctx.user_id}: {e}")
