# Chain Key Evolution

## One-Way Derivation
The Chain Key is explicitly designed as a one-way mathematical function. 
When `ChainKeyAdvancer.advance(ChainKey[N])` is called:
`ChainKey[N+1] = HMAC-SHA256(ChainKey[N], 0x02)`

Because HMAC is a cryptographically secure hash function, it is mathematically infeasible to reverse it. If an attacker compromises `ChainKey[10]`, they cannot compute `ChainKey[9]`. This guarantees **Perfect Forward Secrecy** for all messages prior to the compromise.

## Destruction
Once `ChainKey[N+1]` is generated, `ChainKey[N]` is explicitly zeroized (deleted from the Python object reference).
