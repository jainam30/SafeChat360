# Cryptographic Architecture

## Overview
Phase F1 introduces the foundational cryptographic architecture for SafeChat360 Enterprise. It provides the abstractions necessary for future End-to-End Encryption (E2EE) without modifying current application behavior.

## Core Modules
* **Providers**: Interface-driven approach (`CryptoProvider`) abstracting the underlying crypto engine.
* **Randomness**: `SecureRandomService` ensuring cryptographically secure entropy.
* **Serialization**: `CryptoSerializer` providing versioned encoding for future-proofing key payloads.
* **Policy & Registry**: Enforces secure algorithms and key lengths via `CryptoPolicyService`.

## Integration
Placeholder hooks are embedded in `MessagePipeline` for future interception of payloads:
- Session Establishment
- Payload Encryption/Decryption
- Signature Verification

No live data is encrypted yet. The server continues to route plaintext.
