# Delivery Engine

## Overview
The `DeliveryService` (`services/messaging/delivery.py`) is an abstraction layer sitting over FastAPI's raw WebSockets. It replaces the old monolithic `ConnectionManager`.

## Responsibilities
1. **Connection Management**: Maps `user_id` to active `WebSocket` objects.
2. **Dispatching**: Safely loops over sockets to emit payloads.
3. **Offline Handling**: If a user has no active sockets, the delivery engine falls back (conceptually) to Push Notifications.

```mermaid
sequenceDiagram
    participant Pipeline
    participant DeliveryEngine
    participant ActiveSocket
    participant OfflineQueue
    
    Pipeline->>DeliveryEngine: deliver_message(msg, recipient_ids)
    loop For each recipient
        alt is Connected
            DeliveryEngine->>ActiveSocket: WebSocket send_text(json)
        else is Offline
            DeliveryEngine->>OfflineQueue: Queue Push Notification
        end
    end
```
