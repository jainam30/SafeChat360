# Key Management

## Abstractions
The `KeyStore` interface models a storage backend for public keys.

Supported keys (models only):
* `IdentityKey`: Long-term device identifier.
* `SignedPreKey`: Medium-term key, rotated periodically.
* `OneTimePreKey`: Single-use key for initial async session setup.

## Trust Boundaries
* **Server**: Stores only PUBLIC keys and encrypted payloads. The server NEVER possesses private keys for user identities.
* **Client**: Generates and securely stores PRIVATE keys. Responsible for encryption/decryption operations.

Private keys will not be transmitted to the server.
