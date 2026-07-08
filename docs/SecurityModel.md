# Security Model

## Threat Model
The cryptographic foundation assumes the following:
* The transport layer (TLS) is secure but potentially monitored at endpoints.
* The server infrastructure is trusted to route messages but MUST NOT be trusted with message contents (Zero-Knowledge capability prepared).
* Client devices are assumed to be secure enclaves for private key material.

## Auditing Principles
High-level events (key registered, key rotated, key revoked) are recorded in the `AuditService` for compliance and anomaly detection.
Under no circumstances are the following values logged, audited, or recorded by the server:
* Private Keys
* Shared Secrets
* Message Encryption Keys (MessageKey, MediaKey)
* Plaintext Message Payloads (in the future E2EE phase)
