# Verification Model

## Overview
Because keys are distributed by a central server (FastAPI), a compromised server could hypothetically serve fake public keys (Man-in-the-Middle attack). 

The `VerificationEngine` guards against this by allowing users to verify identities out-of-band.

## Verification States
- `UNVERIFIED`: The default state upon receiving a new public key.
- `VERIFIED`: The user has explicitly confirmed the 60-digit fingerprint or scanned a QR code out-of-band.
- `COMPROMISED`: The user explicitly marked the key as compromised or a key rotation occurred unexpectedly without signature validation.
