from enum import Enum

class SCPErrorCode(str, Enum):
    UNSUPPORTED_VERSION = "UnsupportedVersion"
    INVALID_PACKET = "InvalidPacket"
    MALFORMED_PACKET = "MalformedPacket"
    CAPABILITY_MISMATCH = "CapabilityMismatch"
    AUTHENTICATION_REQUIRED = "AuthenticationRequired"
    INVALID_SESSION = "InvalidSession"
    PROTOCOL_VIOLATION = "ProtocolViolation"
    REPLAY_DETECTED = "ReplayDetected" # Placeholder
    KEY_UNAVAILABLE = "KeyUnavailable" # Placeholder
    RATE_LIMITED = "RateLimited"

class ProtocolException(Exception):
    def __init__(self, code: SCPErrorCode, message: str, is_recoverable: bool = False):
        self.code = code
        self.message = message
        self.is_recoverable = is_recoverable
        super().__init__(self.message)
