from typing import Callable, Dict, List, Type, Any
import asyncio
import logging
from app.events.types import BaseEvent

logger = logging.getLogger(__name__)

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.debug(f"Subscribed handler {handler.__name__} to event {event_type}")

    async def publish(self, event: BaseEvent):
        handlers = self._subscribers.get(event.event_type, [])
        if not handlers:
            logger.debug(f"No handlers found for event: {event.event_type}")
            return
            
        logger.info(f"Publishing event: {event.event_type} to {len(handlers)} handlers")
        
        tasks = []
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    tasks.append(asyncio.create_task(handler(event)))
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Error executing handler {handler.__name__} for event {event.event_type}: {str(e)}")
                
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

# Global singleton for the application (or can be injected via DI)
event_bus = EventBus()
