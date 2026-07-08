from enum import Enum
from typing import List

class ProtocolCapability(str, Enum):
    SUPPORTS_IDENTITY_KEYS = "SUPPORTS_IDENTITY_KEYS"
    SUPPORTS_SIGNED_PREKEYS = "SUPPORTS_SIGNED_PREKEYS"
    SUPPORTS_ONETIME_PREKEYS = "SUPPORTS_ONETIME_PREKEYS"
    SUPPORTS_ATTACHMENTS = "SUPPORTS_ATTACHMENTS"
    SUPPORTS_VOICE = "SUPPORTS_VOICE"
    SUPPORTS_VIDEO = "SUPPORTS_VIDEO"
    SUPPORTS_REACTIONS = "SUPPORTS_REACTIONS"
    SUPPORTS_COMPRESSION = "SUPPORTS_COMPRESSION"
    SUPPORTS_FUTURE_ENCRYPTION = "SUPPORTS_FUTURE_ENCRYPTION"

class CapabilityNegotiator:
    @classmethod
    def get_server_capabilities(cls) -> List[str]:
        return [
            ProtocolCapability.SUPPORTS_IDENTITY_KEYS.value,
            ProtocolCapability.SUPPORTS_SIGNED_PREKEYS.value,
            ProtocolCapability.SUPPORTS_ONETIME_PREKEYS.value,
            ProtocolCapability.SUPPORTS_ATTACHMENTS.value,
            ProtocolCapability.SUPPORTS_REACTIONS.value,
            # Features not yet ready in enterprise scale
            # SUPPORTS_VOICE, SUPPORTS_VIDEO
        ]

    @classmethod
    def intersect(cls, client_caps: List[str]) -> List[str]:
        server_caps = set(cls.get_server_capabilities())
        return list(server_caps.intersection(client_caps))
