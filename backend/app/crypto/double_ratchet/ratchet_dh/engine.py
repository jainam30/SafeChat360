import logging
from typing import Optional
from ..models.state import DoubleRatchetState
from .validator import RemoteKeyValidator
from .rotation import DHRotationManager
from .root_advancer import RootKeyAdvancer

logger = logging.getLogger(__name__)

class DHRatchetEngine:
    """
    Executes the Diffie-Hellman ratchet step when a new public key is received from the contact.
    """
    
    @staticmethod
    def ratchet(state: DoubleRatchetState, new_remote_dh_pub: str) -> Optional[DoubleRatchetState]:
        """
        Advances the Root Key and generates new Chain Keys.
        Returns a structurally new DoubleRatchetState.
        """
        if not state.current_dh_private_key:
            logger.error("Local DH private key missing. Cannot perform DH ratchet.")
            return None

        # 1. Validation
        if not RemoteKeyValidator.validate(new_remote_dh_pub, state.remote_dh_public_key):
            return None # Invalid or duplicate key

        logger.info(f"Initiating DH Ratchet for Session: {state.session_id}")
        
        try:
            # 2. Advance Receiving Chain (using the remote public key that just arrived and our CURRENT private key)
            # This matches the first half of the Signal DH Ratchet step.
            new_root_key, new_recv_chain = RootKeyAdvancer.advance(
                current_root_key=state.root_key,
                local_dh_priv=state.current_dh_private_key,
                remote_dh_pub=new_remote_dh_pub
            )

            # 3. Rotate Local Keypair (to prepare for our next sent message)
            new_dh_priv, new_dh_pub = DHRotationManager.generate_keypair()
            
            # 4. Advance Sending Chain (using the remote public key and our NEW private key)
            final_root_key, new_send_chain = RootKeyAdvancer.advance(
                current_root_key=new_root_key,
                local_dh_priv=new_dh_priv,
                remote_dh_pub=new_remote_dh_pub
            )

            # 5. Create Immutable Updated State
            new_state = state.model_copy(deep=True)
            new_state.root_key = final_root_key
            new_state.sending_chain_key = new_send_chain
            new_state.receiving_chain_key = new_recv_chain
            new_state.remote_dh_public_key = new_remote_dh_pub
            new_state.current_dh_public_key = new_dh_pub
            new_state.current_dh_private_key = new_dh_priv
            
            # Reset counters
            new_state.previous_chain_length = state.sending_message_number
            new_state.sending_message_number = 0
            new_state.receiving_message_number = 0
            new_state.state_version += 1
            
            logger.info("DH Ratchet completed successfully.")
            return new_state
            
        except Exception as e:
            logger.error(f"DH Ratchet failed: {e}")
            return None
            
        finally:
            # 6. Zeroize Old Private Key
            DHRotationManager.zeroize(state.current_dh_private_key)
