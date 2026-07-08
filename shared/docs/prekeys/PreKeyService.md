# Pre-Key Service Architecture

The Pre-Key Distribution Service acts as the public key directory for the SafeChat360 network.

It fundamentally enables asynchronous cryptographic session establishment (X3DH). Without this service, client A and client B would both have to be online at the exact same millisecond to perform a Diffie-Hellman key exchange.

Because this service holds public pre-keys, client A can fetch client B's pre-key bundle at any time, perform the X3DH math locally, encrypt a message, and send it (via the Offline Queue if B is offline), all without B ever connecting to the server.

Crucially, **the server is entirely blind** to the cryptographic secrets. It only validates the length and format of the public keys (ensuring they are 32-byte X25519 public components) and never receives private keys.
