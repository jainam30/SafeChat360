# Handshake Architecture

## Pipeline Overview
The `HandshakeController` acts as a highly constrained gatekeeper between the WebSocket physical connection and the Application business logic.
It forces a Zero-Trust verification of the incoming connection before a `SessionContext` is even allocated.

## Sequence of Components
1. **Packet Validator**: Drops payloads > 512KB and rejects malformed JSON.
2. **Replay Engine**: Verifies `packet_id` novelty.
3. **Capability Negotiator**: Computes intersection of features (e.g. `SUPPORTS_IDENTITY_KEYS`).
4. **Identity Engine**: Checks `DeviceService` to ensure the device isn't revoked.
5. **Challenge-Response**: Asks the client to prove they actually hold the private key for their claimed `IdentityKey`.
6. **Session Context**: Allocates memory for the authenticated socket.
