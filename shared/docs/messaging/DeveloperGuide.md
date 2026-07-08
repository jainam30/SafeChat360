# Developer Guide: Secure Messaging

To all application developers building business logic on SafeChat360:

**Rule #1**: You do not talk to the cryptography layer.
**Rule #2**: You DO NOT talk to the cryptography layer.

The cryptographic engine (Double Ratchet, X3DH, AEAD) is permanently frozen and abstracted. Do not attempt to import keys or manipulate ratchets.

## Sending a Message
1. Create an `OutboundMessage` model containing the recipient and plaintext string.
2. Inject the `SecureMessagingService`.
3. Call `service.send_message(message)`.
4. If it returns an `EncryptedMessage`, route it to the WebSocket. If it returns `None`, the session is invalid or the payload was rejected.

## Receiving a Message
1. When the WebSocket receives an encrypted JSON blob, deserialize it into an `EncryptedMessage` object.
2. Call `service.receive_message(encrypted_message)`.
3. If it returns an `InboundMessage`, the plaintext is safe to use. If it returns `None`, the packet was mathematically rejected (tampered/replay) and MUST be dropped.
