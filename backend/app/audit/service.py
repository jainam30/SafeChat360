import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
import uuid

# Configure a specific logger for audit trails
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# In a real enterprise app, this might go to a separate file or ELK stack
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(message)s'))
if not audit_logger.handlers:
    audit_logger.addHandler(handler)

class AuditService:
    def log_action(
        self,
        action: str,
        user_id: Optional[int],
        resource: str,
        outcome: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if not request_id:
            request_id = str(uuid.uuid4())
            
        # Sanitize details (ensure no passwords/secrets/message contents)
        safe_details = {}
        if details:
            for k, v in details.items():
                k_lower = k.lower()
                if "password" in k_lower or "secret" in k_lower or "token" in k_lower or "content" in k_lower or "message" in k_lower:
                    safe_details[k] = "***REDACTED***"
                else:
                    safe_details[k] = v

        audit_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "user_id": user_id,
            "resource": resource,
            "outcome": outcome,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "request_id": request_id,
            "details": safe_details
        }
        
        audit_logger.info(json.dumps(audit_record))
