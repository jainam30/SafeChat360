# Ephemeral Key Rotation

## Ephemerality
The core of Post-Compromise Security is that private keys must not live long.

`DHRotationManager` explicitly manages this lifecycle. The instant the `DHRatchetEngine` successfully computes the new Root Key and Chain Keys, the old DH private key is destroyed using Python's `del` operator within a `finally` block. 
This guarantees that even if the server memory is imaged a millisecond later, the private key required to decrypt past ratchet steps is mathematically gone forever.
