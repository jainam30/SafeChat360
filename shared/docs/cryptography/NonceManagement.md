# Nonce Management

AES-GCM relies heavily on the "Number Used Once" (Nonce). If a nonce is ever reused with the same MessageKey, the entire AES-GCM cipher breaks catastrophically, revealing the authentication subkey and potentially the plaintext.

## Our Guarantee
SafeChat360 never reuses a `MessageKey`. Because the Double Ratchet advances the Symmetric Chain for every single message, the `MessageKey` is only ever used once in the history of the universe.

Therefore, we can safely generate the 96-bit AES-GCM nonce using `os.urandom(12)`. Even if two messages accidentally generated the same nonce, they are encrypted with entirely different MessageKeys, preserving absolute security.
