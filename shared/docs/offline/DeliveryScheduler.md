# Delivery Scheduler

The `DeliveryScheduler` is a robust queue flusher.

Because it operates asynchronously, it can be triggered by the `ReconnectManager` without halting the active WebSocket connection thread. 

It reads messages from the `OfflineQueueManager` but does *not* delete them upon dispatch. It simply hands them to the transport layer. The message relies on the F6.3 `AckManager` to confirm final receipt before it is officially purged from offline storage. This guarantees zero message loss even if the client disconnects again immediately after connecting.
