import logging
from typing import Tuple
from ..models.state import DoubleRatchetState
from ..derivation.message_key import MessageKeyManager
from ..derivation.chain_key_advancer import ChainKeyAdvancer

logger = logging.getLogger(__name__)

class SymmetricRatchetEngine:
    """
    Executes the Symmetric Ratchet logic, evolving the chain key and yielding a fresh message key.
    """
    
    @staticmethod
    def ratchet_encrypt(state: DoubleRatchetState) -> Tuple[DoubleRatchetState, bytes]:
        """
        Advances the sending chain.
        Returns (NewState, MessageKey)
        """
        if not state.sending_chain_key:
            raise ValueError("Sending chain key is null. Cannot ratchet encrypt.")

        logger.info(f"Advancing Symmetric Ratchet (Sending) for Session: {state.session_id}")
        
        # 1. Derive Message Key
        message_key = MessageKeyManager.derive(state.sending_chain_key)
        
        # 2. Advance Chain Key
        next_chain_key = ChainKeyAdvancer.advance(state.sending_chain_key)
        
        # 3. Create Immutable Updated State
        new_state = state.model_copy(deep=True)
        new_state.sending_chain_key = next_chain_key
        new_state.sending_message_number += 1
        new_state.state_version += 1
        
        # 4. Zeroize Old Chain Key (Python del doesn't guarantee instant memory sweep, but enforces logical destruction)
        del state.sending_chain_key
        
        return new_state, message_key

    @staticmethod
    def ratchet_decrypt(state: DoubleRatchetState) -> Tuple[DoubleRatchetState, bytes]:
        """
        Advances the receiving chain.
        Returns (NewState, MessageKey)
        """
        if not state.receiving_chain_key:
            raise ValueError("Receiving chain key is null. Cannot ratchet decrypt.")

        logger.info(f"Advancing Symmetric Ratchet (Receiving) for Session: {state.session_id}")
        
        # 1. Derive Message Key
        message_key = MessageKeyManager.derive(state.receiving_chain_key)
        
        # 2. Advance Chain Key
        next_chain_key = ChainKeyAdvancer.advance(state.receiving_chain_key)
        
        # 3. Create Immutable Updated State
        new_state = state.model_copy(deep=True)
        new_state.receiving_chain_key = next_chain_key
        new_state.receiving_message_number += 1
        new_state.state_version += 1
        
        # 4. Zeroize Old Chain Key
        del state.receiving_chain_key
        
        return new_state, message_key
