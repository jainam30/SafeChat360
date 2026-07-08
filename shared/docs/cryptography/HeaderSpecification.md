# Double Ratchet Header Specification

Every encrypted payload produced by Phase F5.5 (Future) must be prepended with this immutable header.

## Purpose
The Double Ratchet algorithm is asynchronous. Messages can arrive out of order, or be dropped entirely by the network. The receiver must know *exactly* which message key to derive in order to decrypt a payload. The Header provides this mathematical map.

## Determinism
To defend against tampering, the header will eventually be passed as "Associated Data" to an AEAD encryption function (like AES-GCM). If an attacker flips a single bit in the header, the AEAD authentication tag will fail, and the message will be dropped. This requires the header's byte-representation to be perfectly deterministic.
