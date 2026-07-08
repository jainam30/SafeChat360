# Plaintext Recovery

If authentication succeeds, the AES-GCM cipher recovers the plaintext byte array.

To preserve strict security boundaries, the `AEADDecryptionEngine` wraps the raw bytes into a `PlaintextMessage` immutable object, which tracks the `session_id` and `message_uuid`. 

Crucially, a `finally` block executes `del message_key` to destroy the symmetric key from Python's memory references the instant the decryption concludes.
