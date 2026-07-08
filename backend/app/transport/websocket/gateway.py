import logging
import asyncio
from typing import Dict, Any, Callable
from .connection_manager import ConnectionManager
from .validator import PacketValidator
from .packet_router import PacketRouter
from app.transport.sessions.resolver import SessionResolver

logger = logging.getLogger(__name__)

class TransportGateway:
    """
    The main orchestrator for the transport layer.
    """
    
    def __init__(self, connection_manager: ConnectionManager, router: PacketRouter, resolver: SessionResolver):
        self.connection_manager = connection_manager
        self.router = router
        self.resolver = resolver
        
        # Register core transport routes
        self.router.register_route('heartbeat', self._handle_heartbeat)

    async def handle_connection(self, connection_id: str, websocket: Any):
        """Called when a new WS connection opens."""
        await self.connection_manager.connect(connection_id, websocket)
        
    async def handle_disconnect(self, connection_id: str):
        """Called when a WS connection closes."""
        await self.connection_manager.disconnect(connection_id)
        self.resolver.unlink_connection(connection_id)

    async def handle_receive(self, connection_id: str, payload: str):
        """
        Called when raw text/bytes are received from the WebSocket.
        """
        # 1. Edge Validation (Size limit, JSON parse, Version check)
        data = PacketValidator.validate_raw(payload)
        
        if not data:
            logger.warning(f"Dropping invalid frame from connection {connection_id}")
            return # Drop silently to prevent abuse
            
        # 2. Routing (Push to Handshake engine, Messaging engine, etc)
        await self.router.route_packet(connection_id, data)

    async def _handle_heartbeat(self, connection_id: str, data: Dict[str, Any]):
        """
        Responds to client pings.
        """
        ws = self.connection_manager.get_connection(connection_id)
        if ws:
            # We mock the send mechanism for F6.2
            logger.debug(f"Received heartbeat from {connection_id}. Sending pong.")
            # await ws.send_text('{"type":"pong","version":"1.0"}')
