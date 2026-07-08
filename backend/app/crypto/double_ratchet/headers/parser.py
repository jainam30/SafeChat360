import json
from .models import MessageHeader
from .interfaces import IHeaderParser

class HeaderParser(IHeaderParser):
    """
    Deserializes a byte string back into an immutable MessageHeader object.
    """
    
    def parse(self, data: bytes) -> MessageHeader:
        try:
            json_data = json.loads(data.decode('utf-8'))
            return MessageHeader(**json_data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse header JSON: {e}")
        except Exception as e:
            raise ValueError(f"Failed to construct MessageHeader: {e}")
