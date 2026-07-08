# Challenge-Response Authentication

## Overview
Because passwords and tokens (JWT) can be stolen, Phase F3.2 requires cryptographic proof of possession.

## Flow
1. Server generates a 32-byte secure random nonce.
2. Client signs the nonce using the `IdentityKey` private key (which is locked in `extractable: false` Web Crypto or hardware enclave).
3. Server verifies the signature against the public key attached to the trusted `device_id`.
4. If valid, the client has cryptographically proven they are the physical device they claim to be.
