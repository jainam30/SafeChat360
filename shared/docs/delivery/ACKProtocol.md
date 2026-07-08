# ACK Protocol

Acknowledgement packets (ACKs) are required for all encrypted messages sent over the SafeChat360 network.

When client B successfully decrypts a message from client A, client B's transport layer must immediately generate an ACK packet and route it back.

## Payload Structure
```json
{
  "type": "ack",
  "version": "1.0",
  "message_uuid": "...",
  "session_id": "..."
}
```

## Anti-Spoofing
The `AckManager` strictly validates that the `session_id` in the ACK matches the `session_id` recorded in the `DeliveryTracker`. This prevents a malicious client from spoofing ACKs for another user's session to halt their retry loops.
