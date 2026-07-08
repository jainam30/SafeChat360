import time
from typing import Dict, Set

class ReplayProtectionEngine:
    """
    Prevents replay attacks by tracking recently seen packet UUIDs and nonces.
    """
    def __init__(self, expiration_seconds: int = 300):
        # Maps packet_id to timestamp it was seen
        self._seen_packets: Dict[str, float] = {}
        # Stores active challenge nonces
        self._active_nonces: Set[str] = set()
        self.expiration_seconds = expiration_seconds

    def check_packet_id(self, packet_id: str):
        now = time.time()
        self._cleanup(now)
        
        if packet_id in self._seen_packets:
            raise ValueError(f"Replay detected: Duplicate packet_id {packet_id}")
            
        self._seen_packets[packet_id] = now

    def register_nonce(self, nonce: str):
        if nonce in self._active_nonces:
            raise ValueError("Replay detected: Duplicate nonce generated")
        self._active_nonces.add(nonce)

    def consume_nonce(self, nonce: str):
        if nonce not in self._active_nonces:
            raise ValueError("Invalid or expired nonce")
        self._active_nonces.remove(nonce)

    def _cleanup(self, now: float):
        """Removes expired entries to prevent memory leaks."""
        expired = [pid for pid, ts in self._seen_packets.items() if now - ts > self.expiration_seconds]
        for pid in expired:
            del self._seen_packets[pid]

    def destroy_state(self):
        """Zeroize state on disconnect."""
        self._seen_packets.clear()
        self._active_nonces.clear()
