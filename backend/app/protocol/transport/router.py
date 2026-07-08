from typing import Dict, Callable, Awaitable, Any
from app.protocol.packets.models import BasePacket, PacketType
from app.protocol.errors.codes import ProtocolException, SCPErrorCode
import logging

logger = logging.getLogger(__name__)

# Type alias for a packet handler
PacketHandler = Callable[[BasePacket, Any], Awaitable[None]]

class PacketRouter:
    """
    Registry-based Packet Router.
    Eliminates switch/if statements, allowing O(1) resolution for packet handling.
    """
    def __init__(self):
        self._registry: Dict[PacketType, PacketHandler] = {}

    def register(self, packet_type: PacketType, handler: PacketHandler):
        if packet_type in self._registry:
            raise ValueError(f"Handler for {packet_type} is already registered.")
        self._registry[packet_type] = handler
        logger.debug(f"Registered packet handler for {packet_type}")

    async def route(self, packet: BasePacket, context: Any = None):
        handler = self._registry.get(packet.packet_type)
        if not handler:
            raise ProtocolException(
                code=SCPErrorCode.INVALID_PACKET,
                message=f"No handler registered for packet type: {packet.packet_type}",
                is_recoverable=False
            )
            
        logger.debug(f"Routing packet {packet.packet_type} (ID: {packet.packet_id})")
        await handler(packet, context)
