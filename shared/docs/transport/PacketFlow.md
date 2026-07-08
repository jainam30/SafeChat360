# Packet Flow

When a client sends a WebSocket frame:

1. **Adapter**: (e.g. FastAPI WebSocket endpoint) receives raw bytes and calls `gateway.handle_receive(connection_id, payload)`.
2. **Validator**: `PacketValidator.validate_raw(payload)` checks for `MAX_FRAME_SIZE` (256KB), executes a safe JSON parse, and verifies the protocol `version`. If it fails, the packet is instantly dropped.
3. **Router**: `PacketRouter` inspects the `type` field (e.g. `type: "messaging"` or `type: "heartbeat"`) and dispatches the dictionary to the registered asynchronous handler.
4. **Resolver**: For messaging packets, the handler queries `SessionResolver.resolve_session(connection_id)` to find the associated `SecureSession` ID.
5. **Business Logic**: The handler calls `SecureMessagingService.receive_message()` with the payload and session ID.
