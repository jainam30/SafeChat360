import logging
from typing import List, Dict
from datetime import datetime
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class AuditRecord(BaseModel):
    group_id: str
    action: str
    actor_id: str
    target_id: str = None
    details: Dict[str, str] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AuditManager:
    """
    Append-only log for all group administrative actions.
    """
    
    def __init__(self):
        # group_id -> List of AuditRecords
        self._logs: Dict[str, List[AuditRecord]] = {}
        
    def append(self, record: AuditRecord) -> None:
        """
        Appends a record to the group's audit trail.
        """
        if record.group_id not in self._logs:
            self._logs[record.group_id] = []
            
        self._logs[record.group_id].append(record)
        logger.info(f"Audit [{record.group_id}]: {record.actor_id} performed '{record.action}'")

    def get_logs(self, group_id: str) -> List[AuditRecord]:
        """
        Returns the immutable audit log for a group.
        """
        # Return a copy to prevent mutation
        return list(self._logs.get(group_id, []))
