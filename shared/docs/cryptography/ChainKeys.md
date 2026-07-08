# Chain Keys (Symmetric Ratchet)

Chain Keys form the symmetric (fast) component of the Double Ratchet.
There are two chains running in parallel:
- **Sending Chain**: Advanced every time *we* send a message.
- **Receiving Chain**: Advanced every time *we* receive a message.

## Initialization (F5.1)
When Alice initializes the session, she immediately derives her `SendingChainKey` because she is about to send the first encrypted message. Her `ReceivingChainKey` remains null until Bob responds with his first message (which will carry a new DH key to establish the receiving chain).
