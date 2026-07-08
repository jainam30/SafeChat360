# WebSocket Architecture

## Overview
WebSockets are now isolated inside `GatewayService`.

```mermaid
graph TD
    Client -->|WS Connect| GatewayService
    GatewayService --> PolicyService(Trust Check)
    GatewayService --> ConnectionManager(Register)
    GatewayService --> PubSub(Subscribe user:ID)
    
    Client -->|WS Message| GatewayService
    GatewayService --> ChatService(Process)
    ChatService --> MessagePipeline
```

The Gateway handles `ping/pong` heartbeats, instantly closing connections that fail to respond within a timeout window, preventing stale memory leaks.
