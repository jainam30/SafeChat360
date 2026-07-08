# Delivery Architecture

The Delivery module is responsible for the absolute tracking of all outbound encrypted payloads.

Once the `SecureMessagingService` yields an `EncryptedMessage`, it is inserted into the `DeliveryTracker`. From that moment until an ACK is received (or max retries are exceeded), the message is owned by the delivery state machine.

## Immutable Retries
The most critical architectural decision in SafeChat360 is that **retries must never duplicate cryptographic processing**.

If a message fails to deliver, the `RetryScheduler` fetches the frozen `EncryptedMessage` and pushes it straight to the Transport layer. It does not generate a new message key, does not advance the ratchet, and does not alter the ciphertext. This guarantees that cryptographic state remains mathematically pure, regardless of how hostile or flaky the network is.
