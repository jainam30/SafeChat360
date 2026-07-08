# Transport Threat Model

## Memory Exhaustion (Bomb)
**Threat**: An attacker uploads a massive 1GB text frame to crash the JSON parser and exhaust server memory.
**Mitigation**: The `PacketValidator` enforces a `MAX_FRAME_SIZE_BYTES` limit of 256KB before attempting `json.loads()`.

## CPU Exhaustion (Dead Connections)
**Threat**: Thousands of clients abruptly disconnect without sending TCP FIN packets (e.g. going through a tunnel), leaving hanging sockets eating CPU cycles.
**Mitigation**: The `HeartbeatMonitor` runs asynchronously, pinging all tracked connections. If a connection fails the ping, the `ConnectionManager` actively severs it and frees the memory.

## State Leakage
**Threat**: The transport layer accidentally logs decrypted content or cryptographic ratchets.
**Mitigation**: The transport layer only ever sees `EncryptedMessage` objects and connection IDs. The `SessionResolver` maps connection IDs to `SecureSession` strings, but never touches the actual `DoubleRatchetState`.
