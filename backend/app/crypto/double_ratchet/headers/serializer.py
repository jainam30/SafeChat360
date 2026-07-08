import json
from .models import MessageHeader
from .interfaces import IHeaderSerializer

class HeaderSerializer(IHeaderSerializer):
    """
    Serializes the Header into a deterministic JSON byte string.
    Determinism is mandatory for the future AEAD authentication phase,
    as any change in byte order will cause MAC validation to fail.
    """
    
    def serialize(self, header: MessageHeader) -> bytes:
        # Convert model to dict. We serialize the timestamp explicitly to isoformat
        # to guarantee deterministic string representation.
        data = header.model_dump()
        data['timestamp'] = header.timestamp.isoformat()
        
        # sort_keys=True guarantees deterministic output
        # separators=(',', ':') removes whitespace
        return json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
