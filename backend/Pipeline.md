# Pipeline Architecture

## Overview
The `MessagePipeline` encapsulates the business logic of processing an incoming message payload. It enforces a strict sequence of operations to ensure security, auditability, and modularity.

## Stages (1-12)
1. **Request Validation**: Is the payload malformed?
2. **Content Validation**: Are there empty payloads?
3. **Permission Verification**: Can User A message User B?
4. **Conversation Resolution**: Maps users to a `ConversationEntity`.
5. **Moderation Hook**: Invokes `moderate_text` to check for abuse.
6. **Attachment Validation**: Verifies mime types and queues compression.
7. **Message Persistence**: Saves to the SQL database.
8. **Event Publication**: Dispatches `MessageCreatedEvent`.
9. **Notification Dispatch**: Prepares push notifications for offline users.
10. **Metrics Collection**: Tracks latencies and throughput.
11. **Audit Logging**: Saves a structured JSON audit log.
12. **Delivery Dispatch**: Forwards to the `DeliveryService` for active WebSocket broadcasting.
