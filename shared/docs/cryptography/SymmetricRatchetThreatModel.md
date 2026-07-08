# Symmetric Ratchet Threat Model

## Message Key Reuse
**Threat**: An attacker tricks the system into using the same Message Key twice, catastrophically compromising the AES-GCM nonce guarantees.
**Mitigation**: The `MessageKeyManager` uses an independent cryptographic constant (`0x01`). The `SymmetricRatchetEngine` strictly couples the output of the Message Key with the *instant* destruction of the current Chain Key, making it impossible to accidentally derive the same Message Key twice from the state.

## Chain Key Rollback
**Threat**: An attacker compromises `ChainKey[N]` and attempts to calculate `ChainKey[N-1]` to read past messages.
**Mitigation**: The `ChainKeyAdvancer` relies on HMAC-SHA256, which is preimage resistant. A rollback requires breaking the SHA256 algorithm.
