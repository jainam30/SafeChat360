# Algorithm Registry

## Overview
To prevent "algorithm ossification", the backend maintains an `AlgorithmRegistry`. This allows us to smoothly deprecate aging algorithms in favor of newer ones without breaking the codebase.

## Support Matrix (Phase F1 Baseline)
- **Key Agreement**: `X25519`
- **Signatures**: `Ed25519`
- **Symmetric Encryption**: `AES-256-GCM` or `ChaCha20-Poly1305`
- **Hashing**: `SHA-256` or `BLAKE2b`
- **Key Derivation (KDF)**: `HKDF-SHA256`

The `CryptoPolicyService` strictly enforces these allowed algorithms and ensures any payload specifying a deprecated algorithm (e.g. `MD5` or `DES`) is instantly rejected.
