import logging
from app.crypto.x3dh.session.bootstrap import SecureBootstrapContext
from ..models.state import DoubleRatchetState
from .root_key import RootKeyManager
from .chain_key import ChainKeyManager
from .counter import MessageCounterManager
from .dh_ratchet import DHRatchetState

logger = logging.getLogger(__name__)

class DoubleRatchetInitializer:
    """
    Transforms a SecureBootstrapContext into a DoubleRatchetState.
    Orchestrates the individual specialized managers.
    """
    
    @staticmethod
    def initialize_as_alice(context: SecureBootstrapContext, bob_dh_pub: str) -> DoubleRatchetState:
        """
        Initializes the state for the session initiator (Alice).
        """
        logger.info(f"Initializing Double Ratchet State for Session: {context.session_id}")
        
        # 1. Root Key
        root_key = RootKeyManager.initialize(context.extract_root_secret())
        
        # 2. Chain Keys
        # Alice is the initiator, she derives her sending chain immediately.
        # In a full implementation, we'd use HKDF(RootKey, DH(RatchetPrivA, IK_B)). 
        # Simulated here based on associated_data for scope of F5.1.
        send_chain, recv_chain = ChainKeyManager.initialize(is_initiator=True, derived_shared_secret=context.associated_data)
        
        # 3. Message Counters
        send_num, recv_num, prev_len = MessageCounterManager.initialize()
        
        # 4. DH Ratchet State
        dh_priv, dh_pub, remote_pub = DHRatchetState.initialize(remote_dh_pub=bob_dh_pub)
        
        # 5. Assemble Immutable State
        state = DoubleRatchetState(
            session_id=context.session_id,
            root_key=root_key,
            sending_chain_key=send_chain,
            receiving_chain_key=recv_chain,
            current_dh_public_key=dh_pub,
            current_dh_private_key=dh_priv,
            remote_dh_public_key=remote_pub,
            sending_message_number=send_num,
            receiving_message_number=recv_num,
            previous_chain_length=prev_len,
            protocol_version=context.protocol_version,
            capabilities=context.negotiated_capabilities
        )
        
        logger.info("Double Ratchet State Initialization Complete")
        return state
