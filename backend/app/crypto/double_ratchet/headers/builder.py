import uuid
import time
import logging
from .models import MessageHeader
from .interfaces import IHeaderBuilder
from ..models.state import DoubleRatchetState

logger = logging.getLogger(__name__)

class HeaderBuilder(IHeaderBuilder):
    """
    Constructs the MessageHeader from the current DoubleRatchetState.
    """
    
    def _generate_uuidv7(self) -> str:
        """
        Mock UUIDv7 generation. 
        Python stdlib doesn't have v7, so we prefix a v4 with a timestamp 
        to simulate the lexicographically sortable nature of v7.
        """
        timestamp_hex = hex(int(time.time() * 1000))[2:]
        random_part = uuid.uuid4().hex[len(timestamp_hex):]
        return f"{timestamp_hex}{random_part}"

    def build(self, state: DoubleRatchetState, sender_device_id: str) -> MessageHeader:
        logger.debug(f"Building Header for Session: {state.session_id}, msg={state.sending_message_number}")
        
        if not state.current_dh_public_key:
            raise ValueError("Ratchet State is missing local DH public key.")
            
        header = MessageHeader(
            header_uuid=self._generate_uuidv7(),
            protocol_version=state.protocol_version,
            session_id=state.session_id,
            sender_device_id=sender_device_id,
            ratchet_public_key=state.current_dh_public_key,
            previous_chain_length=state.previous_chain_length,
            message_number=state.sending_message_number,
            capabilities=state.capabilities
        )
        return header
