# Interoperability Plan

SafeChat360 operates on standard cryptographic primitives:
- Ed25519 (Identity)
- X25519 (Key Agreement)
- HKDF-SHA256 (Key Derivation)
- AES-256-GCM (Payload)

Because no proprietary primitives were invented, the SafeChat360 protocol is structurally compatible with any client (iOS, Android, Web) that can implement the standard Signal Double Ratchet algorithm.

Cross-platform test vectors should be generated using standard RFCs to ensure mobile clients correctly resolve gaps and derive identical MessageKeys.
