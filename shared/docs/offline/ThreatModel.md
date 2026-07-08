# Offline Threat Model

## Offline Flooding
**Threat**: An attacker creates a bot to spam an offline user with millions of encrypted payloads, aiming to exhaust server storage limits (Database bomb).
**Mitigation**: The `OfflineQueueManager` enforces a strict `max_queue_size` (e.g., 1000 messages per user). Once reached, it explicitly drops incoming packets, preserving server database capacity.

## Infinite Stale Data
**Threat**: Thousands of users delete the app without deleting their accounts. Their offline queues continue growing and never clear, slowly eating all server disk space over several years.
**Mitigation**: A TTL eviction policy (`max_retention_days = 30`). The queue manager permanently deletes any payload older than 30 days, actively recovering storage.

## Data Breach (Plaintext Leak)
**Threat**: The server database is hacked and dumped.
**Mitigation**: The queue only stores `EncryptedMessage` objects (which are AES-GCM ciphertexts). The server never possesses the `MessageKey` or `RootKey`. The leaked database contains mathematically useless noise.
