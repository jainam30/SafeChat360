# Session Lifecycle

1. **Pending**: Initializing, handshake in progress.
2. **Active**: Cryptographic material derived, ready for E2EE payload transport.
3. **Expired**: Session TTL reached, requires rotation.
4. **Terminated**: Explicitly revoked by user or security policy.

## Key Management
Sessions hold opaque references to secrets. The server never stores plaintext shared keys. The `root_secret_metadata_ref` is an opaque handle to the master secret derived via HKDF-SHA256.
