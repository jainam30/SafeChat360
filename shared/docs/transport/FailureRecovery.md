# Failure Recovery

The Transport layer is designed to fail safely and silently to prevent resource exhaustion.

- **Malformed Frames**: If the `PacketValidator` encounters invalid JSON or missing protocol types, it drops the packet immediately. It does *not* send an error back to the client, as responding to malformed traffic enables DoS reflection attacks.
- **Lost Connections**: If a network tunnel drops, the `HeartbeatMonitor` will detect the broken pipe within `timeout_seconds`. It will forcefully trigger the disconnect sequence, freeing memory and unlinking the session.
- **Crypto Failures**: If the `PacketRouter` correctly routes a payload to the `SecureMessagingService` but the decryption fails (e.g. `InvalidTag`), the messaging service handles it silently. The transport layer remains ignorant of cryptographic state.
