# Distributed Messaging

## Overview
Phase E transitioned the chat engine from a single-node WebSocket loop to a horizontally scalable distributed system.

## Key Abstractions
1. **PubSubProvider**: Pluggable interface for `RedisPubSub` or `MemoryPubSub`.
2. **ConnectionManager**: Local node registry of active physical WebSockets.
3. **GatewayService**: Security & Heartbeat barrier before business logic.

When Alice messages Bob, the `MessagePipeline` routes the payload via the `DeliveryService` into `PubSub`. Whichever node holds Bob's WebSocket connection intercepts the PubSub broadcast and pushes it down the socket.
