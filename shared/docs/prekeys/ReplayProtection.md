# Replay Protection

One-Time Pre-Keys (OPKs) exist to provide Forward Secrecy. If they are reused, that secrecy is compromised.

The `PreKeyReservationService` provides absolute protection against OPK replay attacks:

1. **Strict State Enforcement**: A key must be in the `RESERVED` state to be transitioned to `CONSUMED`.
2. **Terminal Status**: Once a key is `CONSUMED`, it can *never* be accessed or requested again.
3. **Atomic Operations**: By locking the reservation transition, the server prevents an attacker from firing two identical initialization packets at the exact same millisecond and tricking the server into accepting both. The first packet consumes the key; the second packet is rejected because the key is no longer `RESERVED`.
