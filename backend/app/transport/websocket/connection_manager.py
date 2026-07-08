import logging
import asyncio
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages active WebSocket connections.
    Since we are framework agnostic here, a "connection" is represented by a 
    unique connection_id mapping to a generic connection object or queue.
    """
    
    def __init__(self):
        # Maps connection_id (e.g. UUID) to a generic connection object
        self._active_connections: Dict[str, Any] = {}
        
    async def connect(self, connection_id: str, websocket: Any) -> None:
        if connection_id in self._active_connections:
            logger.warning(f"Connection {connection_id} already exists. Overwriting.")
            
        self._active_connections[connection_id] = websocket
        logger.info(f"Connection {connection_id} opened. Total connections: {len(self._active_connections)}")

    async def disconnect(self, connection_id: str) -> None:
        if connection_id in self._active_connections:
            del self._active_connections[connection_id]
            logger.info(f"Connection {connection_id} closed. Total connections: {len(self._active_connections)}")

    def get_connection(self, connection_id: str) -> Optional[Any]:
        return self._active_connections.get(connection_id)
        
    async def broadcast(self, message: bytes) -> None:
        """
        Broadcasts a raw message to all active connections (for system-wide alerts).
        Implementation depends on the underlying websocket object API.
        """
        logger.debug(f"Broadcasting message to {len(self._active_connections)} connections.")
        # In a real async framework like FastAPI, this would loop and await ws.send_bytes(message)
        pass
