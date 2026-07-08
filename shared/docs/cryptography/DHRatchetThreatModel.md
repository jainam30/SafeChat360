# DH Ratchet Threat Model

## Root Key Compromise
**Threat**: An attacker steals the current Root Key from memory.
**Mitigation**: The attacker can read current messages. However, as soon as Alice sends a message (triggering a DH Ratchet on Bob's side) and Bob replies (triggering a DH Ratchet on Alice's side), fresh DH entropy is injected into the Root Key via HKDF. Because the attacker does not possess the ephemeral private keys used for this new DH math, they cannot compute the new Root Key, and lose access to all future messages (Post-Compromise Security).

## Malformed Public Keys
**Threat**: An attacker injects invalid elliptic curve points to force a predictable DH shared secret.
**Mitigation**: The `RemoteKeyValidator` intercepts the key before any DH math occurs, verifying curve membership (simulated as rejecting "MALFORMED" strings in F5.3).
