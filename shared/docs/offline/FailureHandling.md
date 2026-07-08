# Failure Handling

- **Database Disconnects**: If the underlying persistence layer (mocked as in-memory here) fails, the `OfflineQueueManager` will return `False` during enqueue operations. The application layer can then alert the sender that the network is critically unstable.
- **Queue Limits Exceeded**: If a user is offline for 6 months and receives 10,000 messages, the `max_queue_size` will be exceeded. The manager explicitly rejects further messages to protect the database from storage exhaustion attacks. Senders will receive a delivery failure.
