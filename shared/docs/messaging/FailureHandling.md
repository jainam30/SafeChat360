# Failure Handling

Cryptographic operations are inherently fragile by design. A single bit flipped in transit, or a message delayed past the TTL cache, will result in an exception.

The `SecureMessagingService` acts as an exception firewall.

When `session.decrypt_message()` throws an `InvalidTag` (Authentication failed) or `ValueError` (Replay detected), the `SecureMessagingService` catches it, logs a warning, and returns `None`. 

It prevents raw cryptographic stack traces from bubbling up into the application logic, ensuring the application remains stable while safely dropping hostile payloads.
