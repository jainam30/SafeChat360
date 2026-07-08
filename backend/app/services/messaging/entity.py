from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class MessageEntity(BaseModel):
    """
    Standardized internal message entity.
    Acts as the primary model passed through the messaging pipeline.
    """
    id: Optional[int] = None
    conversation_id: str
    sender_id: int
    sender_username: str
    receiver_id: Optional[int] = None  # Populated for direct messages
    group_id: Optional[int] = None     # Populated for group messages
    type: str = "text"
    content: str
    status: str = "Draft"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    reply_to: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    edited_at: Optional[datetime] = None
    
    # Internal context flags set during pipeline
    _is_valid: bool = True
    _validation_errors: List[str] = []
    
    class Config:
        arbitrary_types_allowed = True
