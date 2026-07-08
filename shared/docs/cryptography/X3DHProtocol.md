# X3DH Key Agreement Protocol

## The Mathematics
SafeChat360 Enterprise implements the Extended Triple Diffie-Hellman algorithm to calculate a shared secret before a single message is transmitted. 
When Alice fetches Bob's `PrekeyBundle`, the `X3DHEngine` computes four separate DH shared secrets:

1. `DH1 = DH(IK_a_priv, SPK_b_pub)`
2. `DH2 = DH(EK_a_priv, IK_b_pub)`
3. `DH3 = DH(EK_a_priv, SPK_b_pub)`
4. `DH4 = DH(EK_a_priv, OPK_b_pub)`

These four values are concatenated to form the raw master secret.

## Why 4 Exchanges?
- **DH1**: Provides mutual authentication. Bob knows it came from Alice's Identity.
- **DH2 & DH3**: Provides strong forward secrecy using Alice's Ephemeral Key.
- **DH4**: Provides perfect forward secrecy using Bob's One-Time Prekey. Even if Bob's Identity and Signed Prekeys are compromised later, past messages are secure.
