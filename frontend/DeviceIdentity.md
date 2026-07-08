# Device Identity

## Overview
Identity is strictly bound to a `device_id`, not just a user account.
If a user logs in on a Mobile Phone and a Laptop, each maintains a mutually exclusive `IdentityKey` and distinct trust lifecycle.

## Fingerprints
Because public keys are large binary blobs, `FingerprintGenerator.ts` derives a stable, human-readable 60-digit safety string. This allows two users to verify their connection out-of-band by comparing the string.
