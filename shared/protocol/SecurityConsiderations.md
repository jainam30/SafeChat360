# Security Considerations (Handshake)

- **Timeouts**: Handshakes must complete within 5.0 seconds. This prevents slowloris/tarpit attacks on the authentication layer.
- **Strict Parsing**: Pydantic strictly rejects unknown fields, preventing NoSQL injection or buffer stuffing via metadata fields.
- **Isolation**: By operating independently of the business layer, any catastrophic bug in the handshake engine will just drop sockets rather than compromising data integrity.
