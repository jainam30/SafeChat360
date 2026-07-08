# Capability Negotiation

## Overview
Because Enterprise users often run outdated clients on locked-down company devices, the backend must dynamically adjust its features to match client capabilities.

## Handshake Flow
1. Server receives `HandshakeInit`.
2. Server responds with `HandshakeResponse`.
3. Client sends `CapabilityExchange` listing its support flags (e.g. `SUPPORTS_IDENTITY_KEYS`).
4. Server runs `CapabilityNegotiator.intersect()` to find common ground.
5. Session is bound to this subset. If a client lacks `SUPPORTS_E2EE`, the server dynamically downgrades them to legacy plaintext routing.
