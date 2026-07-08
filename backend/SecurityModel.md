# Security Model

## Trust Boundaries
1. **The Server**: Considered "Honest but Curious" (or potentially compromised). The server is trusted to route messages and store data, but NOT trusted to read message contents or forge identity.
2. **The Client (Device)**: The perimeter of trust. All encryption and decryption occurs here. 

## Audit Restraints
The `CryptoAuditService` is explicitly hardcoded to crash the request if an engineer accidentally attempts to log a variable named `private_key`, `secret`, `plaintext`, or `message_key`. This creates a foolproof safety net against logging sensitive material to SIEM systems.
