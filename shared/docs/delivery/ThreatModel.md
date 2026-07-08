# Delivery Threat Model

## Duplicate ACKs
**Threat**: A hostile client sends 500 ACKs for the same message to exhaust server processing time.
**Mitigation**: The `AckManager` validates the message state. Once the message transitions to `DELIVERED`, all subsequent ACKs for that UUID are instantly rejected as duplicates.

## Retry Storms
**Threat**: A network partition causes thousands of messages to fail simultaneously. When the network restores, all messages retry at the exact same millisecond, crashing the transport layer.
**Mitigation**: The `RetryScheduler` uses exponential backoff (3s, 6s, 12s) to spread out retransmissions, avoiding a synchronized thundering herd.

## Cryptographic Desynchronization
**Threat**: A message retry causes the Double Ratchet to advance twice, desynchronizing the sender and receiver.
**Mitigation**: Retries exclusively re-send the original, immutable `EncryptedMessage`. The cryptographic core is never invoked during a retry.
