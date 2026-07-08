# Skipped Key Threat Model

## Cache Exhaustion Attack
**Threat**: An attacker deliberately sends Message #1, drops #2 through #999,999, and sends Message #1,000,000. They aim to force the receiver to compute 1,000,000 HKDFs and store 1,000,000 keys in memory, crashing the server.
**Mitigation**: The `OutOfOrderResolver` enforces a strict `max_gap` (default 1000). If the gap exceeds this limit, the connection is aborted. The `SkippedKeyStore` also enforces a hard upper bound on total stored keys across the session.

## Stale Key Accumulation
**Threat**: A message is permanently lost in transit. Its skipped key sits in memory forever, eventually causing a memory leak.
**Mitigation**: The `CleanupScheduler` runs periodically in the background, executing a TTL eviction strategy. Keys older than 7 days are permanently deleted.
