# Double Ratchet Threat Model

## Improper Initialization
**Threat**: The state is initialized with non-zero counters, or the Root Key is truncated, leading to immediate decryption failures or weakened security.
**Mitigation**: The `DoubleRatchetInitializer` strictly isolates the derivation steps. `MessageCounterManager` hardcodes counters to `0`. `RootKeyManager` validates the exact 32-byte length of the X3DH secret.

## Key Leakage
**Threat**: The Root Key or Chain Keys are accidentally logged to external observability platforms.
**Mitigation**: The `DoubleRatchetState` overrides `__repr__` to `[CRYPTO STATE HIDDEN]`. The raw bytes are never directly accessible via standard `__str__` casts.

## State Corruption
**Threat**: The state is mutated concurrently by two incoming messages, corrupting the chain.
**Mitigation**: The initialization produces an *immutable* baseline. In Phase F5.2, advancement will utilize functional updates (producing a new state object) rather than mutating the active one.
