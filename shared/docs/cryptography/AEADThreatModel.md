# AEAD Threat Model

## Ciphertext Tampering
**Threat**: A malicious router flips bits in the ciphertext to alter the plaintext message (e.g. changing "Pay $100" to "Pay $900").
**Mitigation**: The AES-GCM cipher generates an Authentication Tag. Any bit-flipping in the ciphertext will completely invalidate the tag. The receiver will drop the message rather than decrypting corrupted data.

## Nonce Reuse
**Threat**: An attacker forces the system to reuse a nonce, breaking the AES-GCM security bounds.
**Mitigation**: The Double Ratchet guarantees the `MessageKey` is never reused. Therefore, even if the 96-bit random nonce collides, the uniqueness of the key preserves mathematical security.

## Plaintext Leakage
**Threat**: The unencrypted plaintext sits in memory and is swept up in a crash dump.
**Mitigation**: The `AEADEncryptionEngine` uses a `finally` block to execute `del plaintext` and `del message_key` the instant the `EncryptedMessage` is constructed.
