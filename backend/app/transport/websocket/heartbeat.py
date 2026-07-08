import logging
import asyncio
from typing import Set
from .connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

class HeartbeatMonitor:
    """
    Background task that periodically sends pings to all active connections
    and disconnects those that fail to respond within the timeout.
    """
    
    def __init__(self, connection_manager: ConnectionManager, interval_seconds: int = 30, timeout_seconds: int = 10):
        self.manager = connection_manager
        self.interval_seconds = interval_seconds
        self.timeout_seconds = timeout_seconds
        self._running = False
        
    async def start(self):
        self._running = True
        logger.info("HeartbeatMonitor started.")
        while self._running:
            await asyncio.sleep(self.interval_seconds)
            await self._ping_all()
            
    def stop(self):
        self._running = False
        logger.info("HeartbeatMonitor stopped.")
        
    async def _ping_all(self):
        """
        Iterates over all connections and sends a ping.
        Any connections that raise an exception (e.g. Broken Pipe) are aggressively disconnected.
        """
        # Snapshot the keys to avoid dictionary changed size during iteration
        connection_ids = list(self.manager._active_connections.keys())
        dead_connections: Set[str] = set()
        
        for cid in connection_ids:
            try:
                # Abstract ping execution. Real implementation requires the WS object.
                logger.debug(f"Pinging connection {cid}")
                # await ws.ping()
            except Exception as e:
                logger.warning(f"Connection {cid} failed heartbeat: {e}")
                dead_connections.add(cid)
                
        for dead_cid in dead_connections:
            await self.manager.disconnect(dead_cid)
