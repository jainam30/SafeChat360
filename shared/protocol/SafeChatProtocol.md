# SafeChat Protocol (SCP) v1

## Overview
SCP is the application-layer protocol running over WebSockets for SafeChat360 Enterprise. It strictly governs state transitions, payload schemas, capability negotiation, and error handling. 

## Design Philosophy
1. **Validation First**: Every packet is evaluated against strict Pydantic schemas before reaching business logic.
2. **Version Pinning**: Every packet explicitly states its `protocol_version`.
3. **Graceful Faults**: Unknown fields or capabilities are gracefully ignored or rejected via standardized error packets.

## Next Steps
In Phase F3.2, this protocol engine will be wired into the `GatewayService` (WebSocket loop) to actively govern all incoming and outgoing connections.
