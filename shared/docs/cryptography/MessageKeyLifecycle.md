# Message Key Lifecycle

## Derivation
Every individual message is encrypted with a unique Message Key.
`MessageKey[N] = HMAC-SHA256(ChainKey[N], 0x01)`

Notice the constant is `0x01` whereas the Chain Key advancement constant is `0x02`. This domain separation ensures that a Message Key can never be mathematically confused for a Chain Key.

## Usage
The Message Key is intended to be used precisely **once** to encrypt or decrypt a payload using an AEAD cipher (like AES-256-GCM). It is immediately discarded thereafter.
