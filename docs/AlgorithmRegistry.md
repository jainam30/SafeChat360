# Algorithm Registry

SafeChat360 Enterprise enforces strict cryptographic algorithms.

## Approved Primitives
* **Key Agreement**: X25519
* **Digital Signatures**: Ed25519
* **Authenticated Encryption (AEAD)**: AES-256-GCM
* **Hashing**: SHA-256
* **Key Derivation (KDF)**: HKDF-SHA-256

These defaults are managed via the `AlgorithmRegistry` and `CryptoPolicyService`. Future upgrades will introduce new versioned algorithms without breaking backward compatibility.
