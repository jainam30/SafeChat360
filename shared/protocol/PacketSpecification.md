# Packet Specification

## Common Structure
Every SCP packet extends `BasePacket` which enforces:
- `protocol_version`: Currently `"SCP/1.0"`
- `packet_type`: Enum (e.g. `HandshakeInit`)
- `packet_id`: Unique string for idempotency and tracing.

## Key Packets
- **HandshakeInit**: The very first payload sent immediately after WebSocket TCP/TLS connection is established. Includes `client_version` and `device_id`.
- **CapabilityExchange**: Sent after handshake to establish feature sets.
- **MessageEnvelope**: Used to deliver chat data. Payload currently holds plaintext, but will transport opaque E2EE Ciphertexts in Phase F4.
