from pydantic import BaseModel
from typing import List, Optional, Callable, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConversationEntity(BaseModel):
    """
    In-memory synthetic representation of a conversation domain.
    """
    id: str  # Format: "direct:user1:user2", "group:group_id", or "system:global"
    type: str  # "direct", "group", "system"
    participant_ids: List[int]
    last_message_id: Optional[int] = None
    last_activity: datetime
    unread_counts: dict = {}
    is_muted: bool = False
    is_archived: bool = False
    is_pinned: bool = False


class ConversationService:
    """
    Resolves message recipients for each conversation type.

    Resolver hooks are injected by the app at startup so this domain layer
    stays decoupled from the database, but still returns real participants:
      - group_members_resolver: group_id -> List[int] member user ids
      - online_users_resolver: () -> List[int] currently connected user ids
    """

    def __init__(
        self,
        group_members_resolver: Optional[Callable[[int], List[int]]] = None,
        online_users_resolver: Optional[Callable[[], List[int]]] = None,
    ):
        self.group_members_resolver = group_members_resolver
        self.online_users_resolver = online_users_resolver

    def resolve_conversation(
        self,
        sender_id: int,
        receiver_id: Optional[int] = None,
        group_id: Optional[int] = None,
    ) -> ConversationEntity:
        if group_id:
            # Group conversation: recipients are ALL members (sender included;
            # the pipeline filters the sender out at dispatch time).
            member_ids: List[int] = []
            if self.group_members_resolver:
                try:
                    member_ids = list(self.group_members_resolver(group_id) or [])
                except Exception as e:
                    logger.warning(f"group_members_resolver failed for group {group_id}: {e}")
            if sender_id not in member_ids:
                member_ids.append(sender_id)
            return ConversationEntity(
                id=f"group:{group_id}",
                type="group",
                participant_ids=member_ids,
                last_activity=datetime.utcnow(),
            )
        elif receiver_id:
            # Direct conversation
            p1, p2 = sorted([sender_id, receiver_id])
            return ConversationEntity(
                id=f"direct:{p1}:{p2}",
                type="direct",
                participant_ids=[p1, p2],
                last_activity=datetime.utcnow(),
            )
        else:
            # Global broadcast: everyone currently connected (sender included;
            # the pipeline filters the sender out at dispatch time). Offline users
            # simply receive it via history when they next load the chat.
            online_ids: List[int] = []
            if self.online_users_resolver:
                try:
                    online_ids = list(self.online_users_resolver() or [])
                except Exception as e:
                    logger.warning(f"online_users_resolver failed: {e}")
            if sender_id not in online_ids:
                online_ids.append(sender_id)
            return ConversationEntity(
                id="system:global",
                type="system",
                participant_ids=online_ids,
                last_activity=datetime.utcnow(),
            )
