# Presence Cluster

The `PresenceService` broadcasts presence updates (online, offline, idle, typing, etc.) across the distributed cluster via Pub/Sub.

When a user's connection status changes, an event is emitted and broadcast to their friends/groups so all active nodes can notify connected clients.

## Sequence
```mermaid
sequenceDiagram
    participant Client
    participant Node
    participant PresenceService
    participant PubSub
    participant Friends Node
    
    Client->>Node: Connect
    Node->>PresenceService: Update State -> Online
    PresenceService->>PubSub: Publish Presence Event
    PubSub->>Friends Node: Route to Friends
    Friends Node->>Friends Client: Push State Update
```
