# Messaging Threat Model

## Application Layer Compromise
**Threat**: A vulnerability in the business logic (e.g. an injection attack) allows an attacker to manipulate the `SecureMessagingService`.
**Mitigation**: The Service only accepts `OutboundMessage` objects and cannot access the underlying `DoubleRatchetState` directly. Even if the application layer is compromised, it cannot extract the `RootKey` or `ChainKey` because the `SecureSession` class does not expose them.

## Memory Exhaustion (Denial of Service)
**Threat**: An attacker submits massive payloads (e.g., 50MB strings) to exhaust server memory and CPU during AES encryption.
**Mitigation**: The `MessageValidator` intercepts all outbound messages *before* encryption. It enforces a strict 256KB payload limit, instantly rejecting oversized payloads before they touch the cryptography layer.
