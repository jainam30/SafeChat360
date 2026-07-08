import logging
from app.crypto.double_ratchet.headers.models import MessageHeader
from app.crypto.double_ratchet.headers.serializer import HeaderSerializer
from .interfaces import IAssociatedDataBuilder

logger = logging.getLogger(__name__)

class AssociatedDataBuilder(IAssociatedDataBuilder):
    """
    Transforms the immutable MessageHeader into deterministic canonical bytes 
    to be used as Associated Data (AAD) for the AEAD cipher.
    """
    
    def __init__(self):
        self.serializer = HeaderSerializer()
        
    def build(self, header: MessageHeader) -> bytes:
        logger.debug(f"Building Canonical AAD for Header UUID: {header.header_uuid}")
        # The HeaderSerializer from F5.4 guarantees deterministic JSON byte output
        return self.serializer.serialize(header)
