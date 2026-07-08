# Double Ratchet Overview

The Signal Double Ratchet algorithm guarantees perfect forward secrecy (PFS) and future secrecy (post-compromise security). 

## How it works (High Level)
1. **The Root Chain**: Advances using Diffie-Hellman (DH) mathematics every time a new DH public key is received from the contact.
2. **The Sending/Receiving Chains**: Advance using symmetric cryptography (HKDF) for every individual message sent or received.

By combining an asymmetric DH ratchet (which heals compromised keys) with a symmetric ratchet (which provides fast, unbreakable encryption for individual messages), the protocol achieves maximum security.
