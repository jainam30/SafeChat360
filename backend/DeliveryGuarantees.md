# Delivery Guarantees

## Overview
To prevent message drops in a distributed environment:

1. **Deduplication**: `MessageOrderingService` drops duplicates based on `message_id` within a 5-minute rolling window.
2. **Sequencing**: Each conversation gets a monotonic integer sequence to allow the client to easily sort and detect missed messages.
3. **Offline Queueing**: If a user is disconnected, `OfflineMessageService` temporarily holds messages until they reconnect, at which point the queue is drained and replayed.
