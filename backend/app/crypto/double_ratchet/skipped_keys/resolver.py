import logging
from typing import Optional, List, Tuple
from app.crypto.double_ratchet.models.state import DoubleRatchetState
from app.crypto.double_ratchet.derivation.symmetric import SymmetricRatchetEngine

logger = logging.getLogger(__name__)

class OutOfOrderResolver:
    """
    Analyzes incoming messages to detect gaps, advances the ratchet to catch up, 
    and harvests the intermediate keys.
    """
    
    def __init__(self, max_gap: int = 1000):
        self.symmetric_engine = SymmetricRatchetEngine()
        self.max_gap = max_gap
        
    def resolve_gap(self, state: DoubleRatchetState, incoming_message_number: int) -> Tuple[DoubleRatchetState, List[Tuple[int, bytes]]]:
        """
        Detects if the incoming message is ahead of our current state.
        If so, derives all skipped message keys and returns them alongside the updated state.
        
        Returns:
            Tuple containing:
            1. The mutated (advanced) DoubleRatchetState
            2. A list of tuples: (skipped_message_number, message_key_bytes)
        """
        skipped_keys = []
        current_state = state
        
        # If the incoming message is in the past, or exactly what we expect, do nothing here.
        # (Past messages will be handled by the SkippedKeyStore lookup directly).
        while current_state.receiving_message_number < incoming_message_number:
            if incoming_message_number - current_state.receiving_message_number > self.max_gap:
                logger.error(f"Message gap too large: {incoming_message_number} vs {current_state.receiving_message_number}")
                raise ValueError("Message gap exceeds maximum allowed threshold.")
                
            # Derive the key for the current receiving number
            logger.info(f"Advancing Symmetric Ratchet to skip message {current_state.receiving_message_number}")
            current_state, message_key = self.symmetric_engine.derive_next(current_state)
            
            # Store the key for the message we just skipped
            # Note: After derive_next, receiving_message_number is incremented, 
            # so the key we just derived belongs to receiving_message_number - 1.
            skipped_index = current_state.receiving_message_number - 1
            skipped_keys.append((skipped_index, message_key))
            
        return current_state, skipped_keys
