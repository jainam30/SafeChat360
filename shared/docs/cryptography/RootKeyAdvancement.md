# Root Key Advancement

## The HKDF KDF
The Root Key acts as the main cryptographic spine. It never directly encrypts anything. Instead, it is used as the **salt** in an HKDF Extract-and-Expand operation.

When a new DH secret is computed, `RootKeyAdvancer` feeds it into the HKDF alongside the current Root Key.
The output of this HKDF is 64 bytes of perfectly random key material, which is cleanly split into two 32-byte halves:
1. **The New Root Key**: Replacing the old one for the next DH step.
2. **The New Chain Key**: Used to initialize the Symmetric Ratchet.
