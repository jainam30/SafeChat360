from typing import List, Dict
import logging
import json

from fastapi import WebSocket
from app.services.messaging.entity import MessageEntity
from app.events.bus import EventBus
from app.events.types import MessageDeliveredEvent

from app.pubsub.provider import PubSubProvider
from app.websocket.manager import ConnectionManager
from app.services.messaging.ordering import MessageOrderingService
from app.services.messaging.offline import OfflineMessageService

logger = logging.getLogger(__name__)

class DeliveryService:
    """
    Enterprise Distributed Delivery Engine.
    Routes messages via Pub/Sub to reach cross-node WebSockets, enforces ordering,
    and handles offline queuing.
    """
    def __init__(
        self, 
        event_bus: EventBus,
        pubsub: PubSubProvider,
        ws_manager: ConnectionManager,
        ordering: MessageOrderingService,
        offline: OfflineMessageService
    ):
        self.event_bus = event_bus
        self.pubsub = pubsub
        self.ws_manager = ws_manager
        self.ordering = ordering
        self.offline = offline

    async def deliver_message(self, message: MessageEntity, recipient_ids: List[int]):
        """
        Main entrypoint from the MessagePipeline.
        """
        # 1. Enforce Deduplication
        if self.ordering.is_duplicate(message.id):
            logger.warning(f"Duplicate message {message.id} detected, dropping.")
            return
        self.ordering.mark_seen(message.id)

        # 2. Assign Sequence Number (for ordered UI rendering)
        seq = self.ordering.assign_sequence(message.conversation_id)
        
        payload = {
            "type": "message",
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sequence": seq,
            "sender_id": message.sender_id,
            "sender_username": message.sender_username,
            "receiver_id": message.receiver_id,
            "group_id": message.group_id,
            "content": message.content,
            "msg_type": message.type,
            "created_at": message.created_at.isoformat() if hasattr(message.created_at, 'isoformat') else message.created_at
        }
        
        payload_str = json.dumps(payload)

        # 3. Distributed Broadcast via Pub/Sub
        for recipient_id in set(recipient_ids):
            # Publish to user's personal channel
            channel = f"user:{recipient_id}"
            await self.pubsub.publish(channel, payload_str)
            
            # Since this node might not hold the connection, we check if they are fully offline
            # In a real cluster, we'd query a distributed presence store.
            # Here, we queue it locally as a fallback mechanism for the assignment constraints.
            # (In production, the node receiving the PubSub message handles Delivery ACKs).
            self.offline.queue_message(recipient_id, message)

        await self.event_bus.publish(MessageDeliveredEvent(
            actor_id=message.sender_id,
            payload={"message_id": message.id, "recipients": recipient_ids}
        ))

    async def broadcast_event(self, event_data: dict, recipient_ids: List[int]):
        """Broadcasts generic system events (e.g. typing, unsent)."""
        payload_str = json.dumps(event_data)
        for recipient_id in set(recipient_ids):
            channel = f"user:{recipient_id}"
            await self.pubsub.publish(channel, payload_str)

    async def handle_pubsub_message(self, user_id: int, payload: str):
        """
        Called when a message arrives from the Pub/Sub bus intended for a user on THIS node.
        """
        success_count = await self.ws_manager.send_to_user(user_id, payload)
        if success_count > 0:
            # If successfully delivered, we can clear it from the offline queue on this node.
            # (Assuming this node handles offline queue for this user).
            self.offline.get_and_clear_queue(user_id)
