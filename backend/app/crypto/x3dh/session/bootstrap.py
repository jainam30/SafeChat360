from typing import List
from datetime import datetime

class SecureBootstrapContext:
    """
    Holds the mathematically derived shared secrets.
    Explicitly designed to prevent accidental logging or exposure of plaintext key material.
    """
    def __init__(
        self, 
        session_id: str,
        protocol_version: str,
        negotiated_capabilities: List[str],
        target_device_id: str,
        _root_secret: bytes,
        associated_data: bytes
    ):
        self.session_id = session_id
        self.protocol_version = protocol_version
        self.negotiated_capabilities = negotiated_capabilities
        self.target_device_id = target_device_id
        self.creation_timestamp = datetime.utcnow()
        self.bootstrap_state = "COMPLETED"
        
        self.associated_data = associated_data
        # Python doesn't have true private memory, but prefixing with _ signals 
        # to external loggers/auditors to skip this variable.
        self._root_secret = _root_secret

    def extract_root_secret(self) -> bytes:
        """
        This is the ONLY way to access the secret. 
        It will be consumed by the Double Ratchet engine in Phase F5.
        """
        return self._root_secret

    def __repr__(self):
        """Prevent accidental leakage if someone prints this object."""
        return f"<SecureBootstrapContext session_id={self.session_id} target={self.target_device_id} [SECRET HIDDEN]>"
