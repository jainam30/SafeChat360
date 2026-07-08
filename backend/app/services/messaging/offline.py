from typing import List, Dict
import logging

from app.services.messaging.entity import MessageEntity
from app.events.bus import EventBus

logger = logging.getLogger(__name__)

class OfflineMessageService:
    """
    Manages queues for users who are currently offline.
    When a user reconnects, this service replays missed messages.
    """
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        # mapping user_id -> List of queued MessageEntity
        self._offline_queues: Dict[int, List[MessageEntity]] = {}

    def queue_message(self, user_id: int, message: MessageEntity):
        if user_id not in self._offline_queues:
            self._offline_queues[user_id] = []
        self._offline_queues[user_id].append(message)
        logger.info(f"Queued message {message.id} for offline user {user_id}")
        
        # In a full implementation, we might trigger a Push Notification hook here.
        # e.g. APNs / FCM

    def get_and_clear_queue(self, user_id: int) -> List[MessageEntity]:
        """Returns pending messages and clears the queue."""
        messages = self._offline_queues.pop(user_id, [])
        if messages:
            logger.info(f"Drained {len(messages)} offline messages for user {user_id}")
        return messages
