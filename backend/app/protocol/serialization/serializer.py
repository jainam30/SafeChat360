import json
from typing import Dict, Any, Type
from ..packets.models import BasePacket, PacketType, PROTOCOL_VERSION
# Import all packet types for dynamic reconstruction
from ..packets.models import (
    HandshakeInit, HandshakeResponse, CapabilityExchange, 
    MessageEnvelope, ErrorPacket, ServerChallenge, ClientChallengeResponse
)

PACKET_REGISTRY: Dict[PacketType, Type[BasePacket]] = {
    PacketType.HANDSHAKE_INIT: HandshakeInit,
    PacketType.HANDSHAKE_RESPONSE: HandshakeResponse,
    PacketType.CAPABILITY_EXCHANGE: CapabilityExchange,
    PacketType.SERVER_CHALLENGE: ServerChallenge,
    PacketType.CLIENT_CHALLENGE_RESPONSE: ClientChallengeResponse,
    PacketType.MESSAGE_ENVELOPE: MessageEnvelope,
    PacketType.ERROR: ErrorPacket,
}

class ProtocolSerializer:
    """
    Serializes and deserializes SCP packets safely.
    Prepared for future binary formats.
    """
    @classmethod
    def serialize(cls, packet: BasePacket) -> str:
        # Defaulting to JSON strings for now
        return packet.model_dump_json()

    @classmethod
    def deserialize(cls, raw_payload: str) -> BasePacket:
        try:
            data = json.loads(raw_payload)
        except json.JSONDecodeError:
            raise ValueError("Malformed payload: Invalid JSON")

        version = data.get("protocol_version")
        if version != PROTOCOL_VERSION:
            raise ValueError(f"Unsupported protocol version: {version}")

        ptype_str = data.get("packet_type")
        if not ptype_str:
            raise ValueError("Missing packet_type")

        try:
            ptype = PacketType(ptype_str)
        except ValueError:
            raise ValueError(f"Unknown packet_type: {ptype_str}")

        model_cls = PACKET_REGISTRY.get(ptype)
        if not model_cls:
            raise ValueError(f"Unregistered packet_type: {ptype_str}")

        return model_cls(**data)
