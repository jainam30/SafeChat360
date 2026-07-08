from typing import List, Optional
from app.events.bus import EventBus
from app.pubsub.provider import PubSubProvider
import json

class PresenceService:
    """
    Manages user presence states across the distributed cluster.
    Publishes Presence events via Pub/Sub to reach all nodes.
    """
    def __init__(self, event_bus: EventBus, pubsub: PubSubProvider):
        self.event_bus = event_bus
        self.pubsub = pubsub

    async def broadcast_presence(self, user_id: int, state: str, broadcast_to: List[int]):
        """
        State: online, offline, idle, typing, recording
        """
        from app.events.types import PresenceChangedEvent
        await self.event_bus.publish(PresenceChangedEvent(
            actor_id=user_id,
            payload={"state": state}
        ))
        
        payload = {
            "type": "presence",
            "user_id": user_id,
            "state": state
        }
        payload_str = json.dumps(payload)
        
        for recipient_id in broadcast_to:
            channel = f"user:{recipient_id}"
            await self.pubsub.publish(channel, payload_str)

    async def broadcast_typing(self, user_id: int, receiver_id: Optional[int], group_id: Optional[int], group_members: List[int] = None):
        """
        Legacy dedicated typing event for backward compatibility.
        """
        from app.events.types import TypingStartedEvent
        await self.event_bus.publish(TypingStartedEvent(
            actor_id=user_id,
            payload={"receiver_id": receiver_id, "group_id": group_id}
        ))
        
        payload = {
            "type": "typing",
            "user_id": user_id,
            "receiver_id": receiver_id,
            "group_id": group_id
        }
        payload_str = json.dumps(payload)
        
        recipients = group_members or []
        if receiver_id and receiver_id not in recipients:
            recipients.append(receiver_id)
            
        for recipient_id in recipients:
            channel = f"user:{recipient_id}"
            await self.pubsub.publish(channel, payload_str)
