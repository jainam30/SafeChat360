# Session Recovery

When a client reconnects, the `ReconnectManager` acts as the trigger mechanism.

It listens for successful WebSocket handshakes and immediately spawns a background asynchronous task `DeliveryScheduler.flush_queue_for_user()`.

This ensures that the client's backlog of offline messages begins delivering immediately without blocking the core event loop that manages the active connections.
