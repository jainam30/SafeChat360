import logging
from typing import Tuple

logger = logging.getLogger(__name__)

class MessageCounterManager:
    """
    Strictly initializes sequence counters to defend against message dropping/replays.
    """
    
    @staticmethod
    def initialize() -> Tuple[int, int, int]:
        """
        Returns (sending_message_number, receiving_message_number, previous_chain_length)
        """
        logger.debug("Message counters initialized to zero.")
        return 0, 0, 0
