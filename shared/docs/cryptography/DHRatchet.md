# Diffie-Hellman Ratchet

The DH Ratchet provides "self-healing" cryptography, known as Post-Compromise Security or Future Secrecy. 

## The Trigger
While the Symmetric Ratchet fires for every single message, the DH Ratchet fires **only** when a message arrives containing a *new* DH public key from the remote contact.

## The Mechanism
When Alice receives Bob's new public key, she:
1. Performs a DH agreement between her *current* private key and Bob's *new* public key to establish a new Receiving Chain.
2. Generates a brand *new* private/public keypair for herself.
3. Performs a DH agreement between her *new* private key and Bob's *new* public key to establish a new Sending Chain.
4. Attaches her *new* public key to all her outbound messages so Bob can perform his own DH Ratchet step when he receives them.
