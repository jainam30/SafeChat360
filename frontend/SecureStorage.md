# Secure Storage

## Constraints
Private keys MUST NEVER be extractable or exposed to standard memory where XSS attacks could exfiltrate them.

## Implementation: IndexedDB
We use `SecureKeyStorage.ts` to push `CryptoKey` objects directly into an `IndexedDB` ObjectStore. 
- The Web Crypto API flags the key as `extractable: false`.
- Even if a malicious script runs, calling `store.get()` returns a `CryptoKey` handle, NOT the raw bytes.
- The raw bytes can never be serialized back to Base64 or exported by JS.
