# Message Encryption Engine

The `AEADEncryptionEngine` orchestrates the final step in the message sending process.

It receives the plaintext, the `MessageHeader`, and the unique `MessageKey`.

1. It asks the `NonceGenerator` for 12 random bytes.
2. It asks the `AssociatedDataBuilder` to serialize the `MessageHeader` into deterministic bytes.
3. It passes these into the python `cryptography` library's `AESGCM` implementation.
4. It splits the resulting byte array into the Ciphertext and the 16-byte Authentication Tag.
5. It yields an immutable `EncryptedMessage` object.
6. Crucially, it executes a `finally` block that forcibly zeroizes the local reference to the plaintext and the `MessageKey`.
