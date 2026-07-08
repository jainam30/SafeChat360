from pydantic import BaseModel
from typing import List

class GroupCreate(BaseModel):
    name: str
    member_ids: List[int]

class GroupResponse(BaseModel):
    id: int
    name: str
    admin_id: int
    member_count: int
