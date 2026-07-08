# HKDF Derivation (HMAC-based Key Derivation Function)

## Purpose
The raw concatenated secret produced by X3DH `(DH1 || DH2 || DH3 || DH4)` is mathematically messy and non-uniform. 
The `HKDFDerivationEngine` uses `HMAC-SHA256` to extract a uniform pseudorandom key (PRK), and then expand it into two distinctly separated 32-byte streams:
1. **Initial Root Secret**: For the Double Ratchet initialization.
2. **Associated Data**: Used for future protocol versioning or metadata binding.

## Configuration
- Hash Algorithm: SHA256
- Info Context: `b"SafeChat360_X3DH"`
