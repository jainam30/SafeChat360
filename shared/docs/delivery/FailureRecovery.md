# Failure Recovery

The Delivery Engine must recover from complete network partitions.

If a client sends a message and their internet connection drops immediately, the `RetryScheduler` will detect the missing ACK.

It will attempt to push the packet to the transport layer at 3s, 6s, and 12s. If the transport layer is offline, these sends will fail instantly.

The message will transition to `FAILED`. In Phase F6.4, these failed messages will be moved into an `OfflineQueue` stored on disk. When the network connection is restored, the queue will flush the pending payloads to the server.
