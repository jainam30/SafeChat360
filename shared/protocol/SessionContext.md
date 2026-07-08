# Session Context

## Definition
The `SessionContext` is an immutable, strictly-typed Pydantic model representing an authenticated, active protocol pipe.

## Contents
It explicitly tracks:
- `session_id`: Unique UUIDv4.
- `client_id`, `device_id`: Identity mapping.
- `identity_fingerprint`: Derived from public key.
- `negotiated_capabilities`: Locked features.
- `sequence_counter`: Defends against packet-dropping attacks during an active session.

## Destruction
Upon physical WebSocket disconnection, the `HandshakeController.destroy()` hook immediately zeroizes all state, preventing any dangling session objects in memory.
