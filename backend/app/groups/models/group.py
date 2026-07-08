from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from app.groups.roles.role_manager import GroupRole

class GroupMember(BaseModel):
    user_id: str
    role: GroupRole
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    suspended: bool = False

class GroupState(BaseModel):
    group_id: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    members: Dict[str, GroupMember] = Field(default_factory=dict) # user_id -> GroupMember
    archived: bool = False
