import logging
from typing import Dict

logger = logging.getLogger(__name__)

class PreKeyMetrics:
    """
    Mock metrics collection for PreKey lifecycle.
    """
    
    def __init__(self):
        self.metrics = {
            "available_keys": 0,
            "consumed_keys": 0,
            "reservation_failures": 0,
            "replay_attempts": 0,
            "pool_replenishments": 0,
            "rotations": 0
        }
        
    def record_available(self, count: int) -> None:
        self.metrics["available_keys"] += count
        
    def record_consumed(self) -> None:
        self.metrics["consumed_keys"] += 1
        
    def record_reservation_failure(self) -> None:
        self.metrics["reservation_failures"] += 1
        
    def record_replay_attempt(self) -> None:
        self.metrics["replay_attempts"] += 1
        logger.warning("METRIC ALERT: Replay attempt detected!")
        
    def record_replenishment(self) -> None:
        self.metrics["pool_replenishments"] += 1
        
    def record_rotation(self) -> None:
        self.metrics["rotations"] += 1
