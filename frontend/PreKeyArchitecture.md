# PreKey Architecture

## Overview
PreKeys allow asynchronous key exchange (X3DH) to occur even when the recipient is offline.

## Signed Pre-Keys
- **Frequency**: Rotated periodically (e.g., weekly or monthly).
- **Purpose**: Authenticates that the specific pre-key bundle was actually created by the identity owner.

## One-Time Pre-Keys
- **Frequency**: Uploaded in batches of 50-100.
- **Purpose**: Consumed exactly once per new conversation. This guarantees forward secrecy even if the Signed Pre-Key is compromised in the future, as the OTPK provides unique entropy for the session setup.
