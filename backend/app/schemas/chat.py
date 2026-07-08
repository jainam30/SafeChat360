from pydantic import BaseModel
from typing import Optional

class SendMessageRequest(BaseModel):
    content: str
    receiver_id: Optional[int] = None
    group_id: Optional[int] = None

class AssistRequest(BaseModel):
    text: str
