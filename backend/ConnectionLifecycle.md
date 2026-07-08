# Connection Lifecycle

## Overview
The `ConnectionManager` and `ConnectionRegistry` manage the raw state of a user's WebSocket.

## Lifecycle
1. **Connect**: Socket connects. `GatewayService` validates Auth.
2. **Register**: Added to `ConnectionRegistry`. Emits `ConnectionOpenedEvent`.
3. **Heartbeat**: Every N seconds, client sends "ping", server replies "pong", updates `last_heartbeat`.
4. **Disconnect**: Cleanly removed from `Registry`. Emits `ConnectionClosedEvent`.
5. **Re-Connect**: Triggers `ConnectionRecoveredEvent`. Flushes `OfflineMessageService`.
