# Root Chain

The Root Chain is the primary cryptographic spine of the Double Ratchet.

It is initialized in Phase F5.1 directly from the 32-byte `Initial Root Secret` derived by the X3DH algorithm. 

## Advancement (Phase F5.2+)
Every time a new Diffie-Hellman public key is received from the remote contact, a new DH shared secret is calculated.
This DH secret is passed into an HKDF along with the *current* Root Key.
The HKDF outputs two new 32-byte keys:
1. A **New Root Key** (replacing the old one)
2. A **New Receiving Chain Key** (used to decrypt incoming messages)
