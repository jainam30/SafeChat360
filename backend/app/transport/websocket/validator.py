import logging
import json
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class PacketValidator:
    """
    The absolute edge firewall. 
    Validates raw string/byte payloads before they are routed or parsed into expensive models.
    """
    
    # 256 KB max frame size to prevent memory exhaustion DoS
    MAX_FRAME_SIZE_BYTES = 256 * 1024 
    
    @classmethod
    def validate_raw(cls, payload: str) -> Optional[Dict[str, Any]]:
        """
        Validates the raw payload size and attempts a safe JSON parse.
        Returns the parsed dictionary if valid, None if malformed/oversized.
        """
        # 1. Size Check
        payload_size = len(payload.encode('utf-8'))
        if payload_size > cls.MAX_FRAME_SIZE_BYTES:
            logger.error(f"Packet rejected: Exceeds max frame size ({payload_size} bytes)")
            return None
            
        # 2. JSON Parse (Safe)
        try:
            data = json.loads(payload)
        except json.JSONDecodeError as e:
            logger.error(f"Packet rejected: Malformed JSON. {e}")
            return None
            
        if not isinstance(data, dict):
            logger.error("Packet rejected: Root element is not a JSON object.")
            return None
            
        # 3. Protocol Enforcement
        if 'type' not in data:
            logger.error("Packet rejected: Missing 'type' routing field.")
            return None
            
        if 'version' not in data or data['version'] != '1.0':
            logger.error("Packet rejected: Unsupported or missing protocol version.")
            return None
            
        return data
