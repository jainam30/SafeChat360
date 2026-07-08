from enum import Enum
from app.core.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

class MessageStatus(str, Enum):
    DRAFT = "Draft"
    QUEUED = "Queued"
    SENDING = "Sending"
    SENT = "Sent"
    DELIVERED = "Delivered"
    DISPLAYED = "Displayed"
    READ = "Read"
    EDITED = "Edited"
    DELETED = "Deleted"
    FAILED = "Failed"
    EXPIRED = "Expired"

class MessageStatusMachine:
    """
    Validates state transitions for a message's lifecycle.
    """
    VALID_TRANSITIONS = {
        MessageStatus.DRAFT: [MessageStatus.QUEUED, MessageStatus.DELETED],
        MessageStatus.QUEUED: [MessageStatus.SENDING, MessageStatus.FAILED, MessageStatus.DELETED],
        MessageStatus.SENDING: [MessageStatus.SENT, MessageStatus.FAILED],
        MessageStatus.SENT: [MessageStatus.DELIVERED, MessageStatus.EDITED, MessageStatus.DELETED],
        MessageStatus.DELIVERED: [MessageStatus.DISPLAYED, MessageStatus.READ, MessageStatus.EDITED, MessageStatus.DELETED],
        MessageStatus.DISPLAYED: [MessageStatus.READ, MessageStatus.DELETED],
        MessageStatus.READ: [MessageStatus.DELETED],
        MessageStatus.FAILED: [MessageStatus.QUEUED, MessageStatus.DELETED],
        MessageStatus.EDITED: [MessageStatus.DELIVERED, MessageStatus.READ, MessageStatus.DELETED],
        MessageStatus.EXPIRED: [MessageStatus.DELETED],
        MessageStatus.DELETED: [] # Terminal state
    }

    def transition(self, current_status: str, next_status: str) -> str:
        try:
            curr = MessageStatus(current_status)
            nxt = MessageStatus(next_status)
        except ValueError:
            raise APIException(status_code=400, detail=f"Invalid status values: {current_status} -> {next_status}")

        if nxt not in self.VALID_TRANSITIONS.get(curr, []):
            logger.error(f"Invalid state transition attempted: {curr.value} -> {nxt.value}")
            raise APIException(status_code=400, detail=f"Invalid transition from {curr.value} to {nxt.value}")

        logger.debug(f"Message transitioned: {curr.value} -> {nxt.value}")
        return nxt.value
