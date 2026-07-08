from pydantic import ValidationError
from ..errors.codes import ProtocolException, SCPErrorCode
from ..serialization.serializer import ProtocolSerializer
from ..packets.models import BasePacket

class PacketValidator:
    """
    Guards the protocol layer from malformed inputs.
    """
    @classmethod
    def validate_raw(cls, raw_payload: str) -> BasePacket:
        # Check payload size to prevent DDoS / buffer exhaustion
        if len(raw_payload) > 1024 * 512: # 512 KB max packet
            raise ProtocolException(
                code=SCPErrorCode.MALFORMED_PACKET,
                message="Packet exceeds maximum allowed size",
                is_recoverable=False
            )
            
        try:
            packet = ProtocolSerializer.deserialize(raw_payload)
            return packet
        except ValueError as e:
            raise ProtocolException(
                code=SCPErrorCode.MALFORMED_PACKET,
                message=str(e),
                is_recoverable=False
            )
        except ValidationError as e:
            raise ProtocolException(
                code=SCPErrorCode.INVALID_PACKET,
                message=f"Schema validation failed: {str(e)}",
                is_recoverable=False
            )
