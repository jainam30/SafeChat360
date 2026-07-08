import logging
from typing import Optional, Tuple
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from .interfaces import ISkippedKeyStore
from .models import SkippedKeyRecord
from .resolver import OutOfOrderResolver

logger = logging.getLogger(__name__)

class SkippedKeyManager:
    """
    Orchestrates gap detection, ratchet advancement, and skipped key storage.
    """
    
    def __init__(self, store: ISkippedKeyStore, max_gap: int = 1000):
        self.store = store
        self.resolver = OutOfOrderResolver(max_gap=max_gap)
        
    def process_incoming(self, state: DoubleRatchetState, incoming_message_number: int, remote_pub_key: str) -> Tuple[DoubleRatchetState, Optional[bytes]]:
        """
        Determines the correct MessageKey for an incoming payload.
        
        Returns:
            Tuple containing:
            1. The mutated (advanced) DoubleRatchetState
            2. The MessageKey bytes (or None if it's a replay/unavailable)
        """
        
        # 1. Is this a delayed message from the past? Check the SkippedKeyStore.
        if incoming_message_number < state.receiving_message_number:
            logger.info(f"Message {incoming_message_number} is in the past. Checking store.")
            key = self.store.consume(state.session_id, remote_pub_key, incoming_message_number)
            if not key:
                logger.warning(f"Replay detected! Key for message {incoming_message_number} already consumed or lost.")
                return state, None
            return state, key
            
        # 2. Is there a gap? (Message is in the future)
        if incoming_message_number > state.receiving_message_number:
            logger.info(f"Gap detected. Current={state.receiving_message_number}, Incoming={incoming_message_number}")
            state, skipped = self.resolver.resolve_gap(state, incoming_message_number)
            
            # Store all the intermediate keys we just harvested
            for msg_num, key_bytes in skipped:
                record = SkippedKeyRecord(
                    session_id=state.session_id,
                    ratchet_public_key=remote_pub_key,
                    message_number=msg_num,
                    message_key=key_bytes
                )
                self.store.store(record)
                
        # 3. We are now exactly aligned with the incoming message. 
        # The calling engine (outside this manager) will do the final `derive_next` to actually decrypt it.
        # This manager's job is just to resolve the gap up to (but not including) the target message.
        return state, None
