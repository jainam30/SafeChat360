# Cryptographic Architecture

## Overview
Phase F1 establishes the strict foundational framework required to deploy End-to-End Encryption (E2EE) across the enterprise platform. 

The architecture strictly follows the **Zero Trust Principle**: The server must never possess, store, or log private cryptographic material.

## The Crypto Module (`app/crypto`)
This module is isolated from standard business logic to prevent cross-contamination of responsibilities. It provides:
1. **CryptoProvider**: Abstraction for low-level math (Hashing, Signatures, AEAD).
2. **SecureRandomService**: Abstraction for CSPRNG (Cryptographically Secure Pseudo-Random Number Generators).
3. **KeyStore**: Interface for storing public keys and managing revocation.
4. **CryptoPolicyService**: Enforces minimum key sizes and blocks deprecated algorithms.

## Pipeline Hooks
The `MessagePipeline` contains disabled hooks (e.g., `_crypto_establish_session`, `_crypto_decrypt_payload`). These currently pass messages through transparently. In Phase F2 (Protocol implementation), these hooks will be wired to actual cryptographic protocols like X3DH.
