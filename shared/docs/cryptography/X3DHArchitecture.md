# X3DH Prekey Architecture

## Overview
The Extended Triple Diffie-Hellman (X3DH) protocol enables asynchronous secure session establishment. Because the target user might be offline, the server acts as an intermediary, storing a cryptographic "Bundle" of keys for that user.

## Component Flow
1. Client generates Identity Key, Signed Prekey, and 100 One-Time Prekeys.
2. Client uploads these to `/api/x3dh/keys/upload`.
3. Backend `SignedPrekeyManager` and `OneTimePrekeyManager` store them via `PrekeyRepository`.
4. Alice wants to message Bob. Alice calls `BundleDistributionService`.
5. `PrekeyBundleGenerator` retrieves Bob's Identity, his active Signed Prekey, and exactly ONE One-Time Prekey.
6. The OPK is instantly marked `CONSUMED` to prevent reuse.
7. Alice uses this bundle to compute the shared secret and send the first encrypted message.
