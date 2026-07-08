# Crypto Providers

The `CryptoProvider` interface defines all necessary low-level operations:
* Key Pair Generation
* Hashing
* Digital Signatures
* Authenticated Encryption (AEAD)
* Key Derivation (KDF)

Implementations of this interface will rely on mature libraries (e.g., `cryptography` in Python or `libsodium`). Custom crypto is strictly prohibited.
