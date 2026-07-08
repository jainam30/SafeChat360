# Offline Architecture

SafeChat360 operates on an Asynchronous Delivery Model.

When client A encrypts a message for client B, there is no guarantee that client B is online.

The `SessionRecoveryManager` intercepts messages that have exhausted their active network retries (via the `RetryScheduler`) and transitions them into the `OfflineQueueManager`.

Crucially, the server only ever stores the `EncryptedMessage`. It does not store plaintext. Furthermore, the Double Ratchet state on the sender's device advanced at the moment of encryption. The offline queue ensures that whenever client B finally reconnects, the exact ciphertext that matches their current cryptographic expectation is delivered, keeping the ratchets mathematically synchronized.
