import logging
import uuid
from typing import Dict, Optional
from app.groups.models.group import GroupState, GroupMember
from app.groups.roles.role_manager import GroupRole

logger = logging.getLogger(__name__)

class GroupRepository:
    """
    Mock persistence for groups.
    """
    
    def __init__(self):
        self._store: Dict[str, GroupState] = {}
        
    def create(self, name: str, creator_id: str) -> GroupState:
        group_id = str(uuid.uuid4())
        group = GroupState(group_id=group_id, name=name)
        
        # Creator is always the owner
        group.members[creator_id] = GroupMember(user_id=creator_id, role=GroupRole.OWNER)
        
        self._store[group_id] = group
        logger.info(f"Group {group_id} ('{name}') created by {creator_id}")
        return group
        
    def get(self, group_id: str) -> Optional[GroupState]:
        return self._store.get(group_id)
        
    def delete(self, group_id: str) -> bool:
        if group_id in self._store:
            del self._store[group_id]
            logger.info(f"Group {group_id} deleted")
            return True
        return False
