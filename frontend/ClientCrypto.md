# Client Crypto Architecture

## Overview
Phase F2 establishes the frontend execution environment for cryptography. All private key generation and management now occur directly on the end-user's device. 

## Trust Perimeter
- **Zero Extradition**: Web Crypto API generates `CryptoKey` objects with `extractable: false`. The browser physically prevents application JS from viewing the raw private key bytes.
- **Web Worker Offloading**: `crypto.worker.ts` executes heavy cryptographic routines off the main React thread.

## Component Flow
1. User logs in from a new device.
2. `VerificationEngine` initializes.
3. React requests `GENERATE_IDENTITY` from Web Worker.
4. Worker creates keys, stores private keys in `SecureKeyStorage` (IndexedDB).
5. Worker returns public bytes.
6. React uploads Public Keys to `/api/pki/keys/identity`.
