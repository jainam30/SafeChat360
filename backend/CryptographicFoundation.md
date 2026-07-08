# Cryptographic Foundation (Phase D)

## Overview
The `KeyManagementService` and `CryptographicIdentity` interfaces have been established to prepare the backend for End-to-End Encryption.

## Architecture
- **Zero-Knowledge Principle**: Private keys are NEVER sent to the backend. The server only tracks public material.
- **Key Types Supported**:
  1. Identity Keys (Long-term)
  2. Signed Pre-Keys (Medium-term, rotated periodically)
  3. One-Time Pre-Keys (Consumed per new session)

## Future Flow (Phase E)
When Alice wants to message Bob:
1. Alice calls `KMS.get_public_keys(Bob.id)`.
2. Alice retrieves Bob's Identity Key, Signed Pre-Key, and one One-Time Pre-Key.
3. Alice computes the shared secret locally using X3DH.
4. Alice dispatches the ciphertext through the `MessagePipeline`.
