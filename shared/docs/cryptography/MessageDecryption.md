# Message Decryption

The `AEADDecryptionEngine` is responsible for safely extracting plaintext from an inbound `EncryptedMessage`.

## Authenticate First, Decrypt Second
The engine absolutely refuses to yield any plaintext until mathematical authentication has passed.
1. It validates the header metadata structure.
2. It recreates the Associated Data (AAD) bytes exactly as the sender did.
3. It hands the Ciphertext, the AAD, and the Authentication Tag to the AES-GCM cipher.
4. The cipher computes the MAC over the Ciphertext + AAD and compares it to the attached Authentication Tag.
5. If and only if the tags match perfectly, the plaintext is decrypted and returned in an immutable `PlaintextMessage` wrapper.
