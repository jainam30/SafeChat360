from typing import Dict, Any, Optional
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

class FeatureFlagService:
    def __init__(self):
        # In-memory store for feature flags. In production, this might be backed by DB/Redis/LaunchDarkly.
        self._flags: Dict[str, Dict[str, Any]] = {
            "e2ee_messaging": {"enabled": False, "percentage": 0, "users": []},
            "voice_calls": {"enabled": True, "percentage": 100, "users": []},
            "video_calls": {"enabled": False, "percentage": 10, "users": [1, 2, 3]},
            "ai_assistant": {"enabled": True, "percentage": 100, "users": []},
            "beta_ui": {"enabled": False, "percentage": 0, "users": []}
        }

    def _hash_based_rollout(self, flag_name: str, user_id: int, percentage: int) -> bool:
        if percentage <= 0:
            return False
        if percentage >= 100:
            return True
            
        hash_input = f"{flag_name}:{user_id}".encode('utf-8')
        hash_val = int(hashlib.md5(hash_input).hexdigest(), 16)
        # Check if the hash falls within the percentage (0-99)
        return (hash_val % 100) < percentage

    def is_enabled(self, flag_name: str, user_id: Optional[int] = None) -> bool:
        flag = self._flags.get(flag_name)
        if not flag:
            return False
            
        # 1. Check if globally disabled/enabled ignoring rollout
        if not flag.get("enabled"):
            return False
            
        # 2. Check if user-specific override exists
        if user_id is not None and user_id in flag.get("users", []):
            return True
            
        # 3. Check percentage rollout
        percentage = flag.get("percentage", 0)
        if user_id is not None:
            return self._hash_based_rollout(flag_name, user_id, percentage)
        else:
            return percentage == 100

    def set_flag(self, flag_name: str, enabled: bool, percentage: int = 100, users: list = None):
        if users is None:
            users = []
        self._flags[flag_name] = {
            "enabled": enabled,
            "percentage": percentage,
            "users": users
        }
        logger.info(f"Feature flag updated: {flag_name} -> {self._flags[flag_name]}")

    def get_all_flags(self) -> Dict[str, Dict[str, Any]]:
        return self._flags
