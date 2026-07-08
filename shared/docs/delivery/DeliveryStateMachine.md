# Delivery State Machine

Every outbound message enters a deterministic state machine:

1. `CREATED`: Object created in memory.
2. `ENCRYPTED`: Safely processed by the `SecureMessagingService`. It is now an immutable `EncryptedMessage`.
3. `QUEUED`: Enqueued for network transmission.
4. `SENT`: Flushed to the WebSocket. The `RetryScheduler` begins monitoring.
5. `DELIVERED`: A valid `AckPacket` was received from the target client. Terminal state.
6. `FAILED`: The retry scheduler exhausted its attempts (e.g. 3 retries failed). Terminal state (until offline queues are introduced).

The `DeliveryStateMachine` absolutely forbids illegal transitions. For instance, a `DELIVERED` message cannot transition back to `SENT`, preventing duplicate processing.
