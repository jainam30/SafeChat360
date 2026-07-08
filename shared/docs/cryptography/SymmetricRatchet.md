# Symmetric Ratchet Architecture

The Symmetric Ratchet is the workhorse of the Double Ratchet algorithm. While the DH Ratchet operates only when a contact replies, the Symmetric Ratchet operates for **every single message sent or received**.

## Functional Immutability
To avoid nasty race conditions where asynchronous network requests attempt to advance the ratchet simultaneously, the `SymmetricRatchetEngine` treats the `DoubleRatchetState` as functionally immutable. 
Calling `ratchet_encrypt(state)` returns a structurally entirely new `(NewState, MessageKey)` tuple.
