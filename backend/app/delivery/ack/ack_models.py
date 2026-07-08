from pydantic import BaseModel
from typing import Literal

class AckPacket(BaseModel):
    """
    Protocol definition for an Acknowledgement packet.
    """
    type: Literal["ack"] = "ack"
    version: str = "1.0"
    message_uuid: str
    session_id: str
