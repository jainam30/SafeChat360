# Messaging Architecture

The `SecureMessagingService` operates as a strictly defined air-gap between the SafeChat360 Application Layer (Business Logic) and the Cryptographic Core (Phase F5).

## Encapsulation
The application layer must **never** import `SymmetricRatchetEngine`, `AEADEncryptionEngine`, or `HeaderBuilder`. 

Instead, the application provides an `OutboundMessage` (containing plaintext) to the `SecureMessagingService`. The service looks up the active `SecureSession`, which internally orchestrates the cryptography and yields an `EncryptedMessage`.

This isolation guarantees that if a developer makes a mistake in the business logic (like trying to reuse a session incorrectly), the cryptographic engine's strict validation boundaries will catch it, preventing systemic security failures.
