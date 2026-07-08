# Key Management (KeyStore)

## Overview
The `KeyStore` interface decouples public key storage from the main user database. It is designed around the future needs of the Double Ratchet / Signal Protocol.

## Key Types
- **IdentityKey**: A long-term keypair generated upon device registration. The server only sees the public Identity Key.
- **SignedPreKey**: A medium-term keypair signed by the IdentityKey. Used in initial key exchange.
- **OneTimePreKey**: A batch of single-use keys uploaded by clients to prevent replay attacks and ensure forward secrecy even for offline receivers.

## Revocation
When a device is revoked, the `KeyStore` must instantly destroy all prekeys and untrust the IdentityKey.
