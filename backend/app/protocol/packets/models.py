from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

PROTOCOL_VERSION = "SCP/1.0"

class PacketType(str, Enum):
    HANDSHAKE_INIT = "HandshakeInit"
    HANDSHAKE_RESPONSE = "HandshakeResponse"
    CAPABILITY_EXCHANGE = "CapabilityExchange"
    SERVER_CHALLENGE = "ServerChallenge"
    CLIENT_CHALLENGE_RESPONSE = "ClientChallengeResponse"
    SESSION_REQUEST = "SessionRequest"
    SESSION_RESPONSE = "SessionResponse"
    KEY_REQUEST = "KeyRequest"
    KEY_RESPONSE = "KeyResponse"
    PRESENCE_UPDATE = "PresenceUpdate"
    TYPING_UPDATE = "TypingUpdate"
    DELIVERY_ACK = "DeliveryAck"
    DELIVERY_RECEIPT = "DeliveryReceipt"
    MESSAGE_ENVELOPE = "MessageEnvelope"
    ATTACHMENT_ENVELOPE = "AttachmentEnvelope"
    HEARTBEAT = "Heartbeat"
    DISCONNECT = "Disconnect"
    ERROR = "ErrorPacket"

class BasePacket(BaseModel):
    protocol_version: str = Field(default=PROTOCOL_VERSION, const=True)
    packet_type: PacketType
    packet_id: str

class ErrorPacket(BasePacket):
    packet_type: PacketType = Field(default=PacketType.ERROR, const=True)
    error_code: str
    message: str
    is_recoverable: bool

class HandshakeInit(BasePacket):
    packet_type: PacketType = Field(default=PacketType.HANDSHAKE_INIT, const=True)
    client_version: str
    device_id: str

class HandshakeResponse(BasePacket):
    packet_type: PacketType = Field(default=PacketType.HANDSHAKE_RESPONSE, const=True)
    server_version: str
    accepted: bool

class CapabilityExchange(BasePacket):
    packet_type: PacketType = Field(default=PacketType.CAPABILITY_EXCHANGE, const=True)
    capabilities: List[str]

class ServerChallenge(BasePacket):
    packet_type: PacketType = Field(default=PacketType.SERVER_CHALLENGE, const=True)
    challenge_nonce: str

class ClientChallengeResponse(BasePacket):
    packet_type: PacketType = Field(default=PacketType.CLIENT_CHALLENGE_RESPONSE, const=True)
    challenge_signature: str

class MessageEnvelope(BasePacket):
    packet_type: PacketType = Field(default=PacketType.MESSAGE_ENVELOPE, const=True)
    conversation_id: str
    sender_id: int
    payload: str # Plaintext for now, ciphertext in future phases
    metadata: Dict[str, Any] = Field(default_factory=dict)
