import logging
import asyncio
from app.offline.scheduler.delivery_scheduler import DeliveryScheduler

logger = logging.getLogger(__name__)

class ReconnectManager:
    """
    Listens for transport reconnect events and triggers offline queue recovery.
    """
    
    def __init__(self, scheduler: DeliveryScheduler):
        self.scheduler = scheduler
        
    async def handle_client_reconnect(self, user_id: str, active_session_id: str) -> None:
        """
        Called by the transport layer when a client successfully authenticates a WebSocket connection.
        """
        logger.info(f"Client {user_id} reconnected. Triggering offline recovery.")
        
        # Dispatch asynchronously to avoid blocking the connection handshake
        asyncio.create_task(
            self.scheduler.flush_queue_for_user(user_id, active_session_id)
        )
