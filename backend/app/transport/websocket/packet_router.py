import logging
from typing import Dict, Any, Callable, Awaitable

logger = logging.getLogger(__name__)

class PacketRouter:
    """
    Routes validated JSON payloads to the appropriate backend subsystem.
    """
    
    def __init__(self):
        # Maps string 'type' -> async handler function
        self._routes: Dict[str, Callable[[str, Dict[str, Any]], Awaitable[None]]] = {}
        
    def register_route(self, packet_type: str, handler: Callable[[str, Dict[str, Any]], Awaitable[None]]):
        self._routes[packet_type] = handler
        logger.info(f"Registered route for packet type: '{packet_type}'")
        
    async def route_packet(self, connection_id: str, data: Dict[str, Any]) -> None:
        packet_type = data.get('type')
        
        handler = self._routes.get(packet_type)
        if not handler:
            logger.warning(f"Packet dropped: Unknown route '{packet_type}' from connection {connection_id}")
            return
            
        try:
            logger.debug(f"Routing '{packet_type}' from connection {connection_id}")
            await handler(connection_id, data)
        except Exception as e:
            logger.error(f"Error routing packet '{packet_type}': {e}")
