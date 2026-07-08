import time
from typing import Dict, Any, List

class MessageOrderingService:
    """
    Enforces ordered delivery and duplicate prevention.
    Assigns sequential sequence numbers to messages in a conversation.
    """
    def __init__(self):
        # conversation_id -> last_sequence_number
        self._sequences: Dict[str, int] = {}
        # In a real system, this is stored in Redis to be cross-node.
        # message_id -> timestamp (for deduplication)
        self._seen_messages: Dict[str, float] = {}
        self.DEDUP_WINDOW_SECONDS = 300

    def assign_sequence(self, conversation_id: str) -> int:
        current = self._sequences.get(conversation_id, 0)
        next_seq = current + 1
        self._sequences[conversation_id] = next_seq
        return next_seq

    def is_duplicate(self, message_id: str) -> bool:
        """Returns True if the message was already processed recently."""
        now = time.time()
        # Cleanup old entries (primitive)
        if len(self._seen_messages) > 10000:
            self._seen_messages = {k: v for k, v in self._seen_messages.items() if now - v < self.DEDUP_WINDOW_SECONDS}
            
        if message_id in self._seen_messages:
            if now - self._seen_messages[message_id] < self.DEDUP_WINDOW_SECONDS:
                return True
        return False

    def mark_seen(self, message_id: str):
        self._seen_messages[message_id] = time.time()
