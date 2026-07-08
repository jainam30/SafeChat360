from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ConversationEntity(BaseModel):
    """
    In-memory synthetic representation of a conversation domain.
    """
    id: str  # Format: "direct:user1:user2" or "group:group_id"
    type: str # "direct", "group", "system"
    participant_ids: List[int]
    last_message_id: Optional[int] = None
    last_activity: datetime
    unread_counts: dict = {}
    is_muted: bool = False
    is_archived: bool = False
    is_pinned: bool = False

class ConversationService:
    def resolve_conversation(self, sender_id: int, receiver_id: Optional[int], group_id: Optional[int]) -> ConversationEntity:
        """
        Dynamically constructs a ConversationEntity based on the participants.
        Since we cannot alter the database schema, this acts as our synthetic domain layer.
        """
        if group_id:
            # Group Conversation
            # Note: participant_ids could be fetched from GroupRepository if needed
            return ConversationEntity(
                id=f"group:{group_id}",
                type="group",
                participant_ids=[sender_id], 
                last_activity=datetime.utcnow()
            )
        elif receiver_id:
            # Direct Conversation
            # Sort IDs to guarantee consistent conversation ID regardless of who sent first
            p1, p2 = sorted([sender_id, receiver_id])
            return ConversationEntity(
                id=f"direct:{p1}:{p2}",
                type="direct",
                participant_ids=[p1, p2],
                last_activity=datetime.utcnow()
            )
        else:
            # Global/System Broadcast
            return ConversationEntity(
                id="system:global",
                type="system",
                participant_ids=[],
                last_activity=datetime.utcnow()
            )
