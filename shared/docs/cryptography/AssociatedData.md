# Associated Data (AAD)

The AAD parameter is what bridges the Double Ratchet's asynchronous metadata with the AES payload.

## Authentication Without Encryption
The `MessageHeader` must remain unencrypted because the receiver cannot know which key to use to decrypt the payload until they read the header (which tells them the `ratchet_public_key` and `message_number`).

However, if it's unencrypted, an attacker could tamper with it. 

By feeding the serialized header into the `AAD` parameter of the AES-GCM cipher, the algorithm mathematically binds the header's bytes to the payload's Authentication Tag. If a single byte of the header is changed in transit, the `AESGCM.decrypt()` function will raise an `InvalidTag` exception and drop the message.
