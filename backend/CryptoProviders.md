# Cryptographic Providers

## Abstraction Boundary
The `CryptoProvider` interface protects the application from being tightly coupled to a single cryptographic library (e.g., `cryptography`, `PyNaCl`, or `hashlib`).

## Responsibilities
- **AEAD Encryption**: Authenticated Encryption with Associated Data (e.g. `AES-GCM` or `ChaCha20-Poly1305`).
- **Hashing & Signatures**: Generating digital signatures and verifying them (e.g. `Ed25519`).
- **Key Derivation (KDF)**: Deriving symmetric keys from shared secrets (e.g. `HKDF`).

By depending entirely on this interface, we can migrate underlying libraries in the future with zero changes to the messaging pipeline.
