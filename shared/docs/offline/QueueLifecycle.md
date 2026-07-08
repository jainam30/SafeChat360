# Queue Lifecycle

1. **Enqueue**: Message enters `FAILED` state in active delivery. It is moved to the persistent `OfflineQueueRepository`.
2. **Expiration Sweep**: The `OfflineQueueManager` continuously enforces a 30-day TTL. If a message sits in the queue longer than 30 days, it is permanently deleted to prevent storage exhaustion.
3. **Dequeue**: When the `ReconnectManager` fires, the `DeliveryScheduler` fetches all non-expired messages for that user.
4. **Transmission**: The messages are pushed to the transport layer.
5. **Acknowledge**: The messages *remain* in the queue until the remote client explicitly sends an ACK packet, at which point `acknowledge_delivery` is called, finally removing them from disk.
