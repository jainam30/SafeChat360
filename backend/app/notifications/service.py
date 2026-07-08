from typing import List, Dict, Any
import asyncio
from .providers import NotificationProvider
import logging

logger = logging.getLogger(__name__)

class NotificationEngine:
    def __init__(self, providers: List[NotificationProvider]):
        self.providers = providers

    async def notify(self, user_id: int, title: str, message: str, data: Dict[str, Any] = None, channels: List[str] = None):
        """
        Dispatch a notification through the requested channels.
        If channels is None, dispatch via all registered providers.
        """
        logger.info(f"NotificationEngine: Dispatching notification to user {user_id}")
        
        tasks = []
        for provider in self.providers:
            # Simple channel filtering logic based on class name
            provider_name = provider.__class__.__name__.lower().replace("provider", "")
            if channels is None or provider_name in channels:
                tasks.append(asyncio.create_task(provider.send(user_id, title, message, data)))
                
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, Exception):
                    logger.error(f"NotificationEngine error: {str(r)}")
        return True
