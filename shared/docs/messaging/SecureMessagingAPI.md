# Secure Messaging API

## Sending a Message
1. Construct `OutboundMessage(recipient_id, session_id, plaintext_payload)`.
2. Call `SecureMessagingService.send_message(message)`.
3. Receive `EncryptedMessage`.
4. (Future) Route the `EncryptedMessage` to the WebSocket transport.

## Receiving a Message
1. (Future) WebSocket transport receives `EncryptedMessage` bytes and parses it.
2. Call `SecureMessagingService.receive_message(encrypted_message, sender_id)`.
3. The service delegates to `SecureSession.decrypt_message()`.
4. Receive `InboundMessage` containing the safe plaintext.
