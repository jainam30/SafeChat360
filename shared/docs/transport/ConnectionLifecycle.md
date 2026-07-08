# Connection Lifecycle

1. **Open**: The WebSocket upgrade handshake completes. The framework adapter assigns a UUID string (Connection ID) and calls `gateway.handle_connection()`. The `ConnectionManager` stores the socket in memory.
2. **Link**: The client sends a Handshake protocol packet. Once authenticated, the server creates a `SecureSession`. The `SessionResolver` links the Connection ID to the Session ID.
3. **Active**: The client sends messaging frames. The `HeartbeatMonitor` periodically pings the connection.
4. **Close**: The client disconnects, or the heartbeat monitor detects a timeout. The adapter calls `gateway.handle_disconnect()`. The `SessionResolver` unlinks the connection, and the `ConnectionManager` deletes the socket from memory.
