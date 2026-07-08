# Skipped Message Keys

The Double Ratchet algorithm is strictly forward-sequential. If a client is expecting Message #2, but receives Message #5, it cannot simply decrypt Message #5. It must first mathematically derive the Symmetric Keys for Messages #2, #3, and #4, and *then* derive the key for #5.

However, because these keys are derived via a one-way Hash-based Key Derivation Function (HKDF), once the ratchet advances past #5, the keys for #2, #3, and #4 can never be computed again.

To solve this, the ratchet "harvests" the intermediate keys and places them into the `SkippedKeyStore`. When the delayed messages finally arrive over the network, their keys are ready and waiting.
