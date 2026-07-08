# Pre-Key Lifecycle

1. **Upload**: A newly registered device generates an `IdentityKey`, a `SignedPreKey`, and a batch of 100 `OneTimePreKeys` (OPKs) locally. It uploads only the public halves to the server.
2. **Available**: The server stores these keys. The OPKs sit in the `ACTIVE` state.
3. **Reservation**: A sender requests a bundle. The `PreKeyReservationService` fetches the IdentityKey and SignedPreKey, and atomically selects one OPK, transitioning it to `RESERVED` for 5 minutes.
4. **Consumption**: The sender establishes the session, sends the first message, and informs the server. The server transitions the OPK to `CONSUMED`. It can never be used again.
5. **Replenishment**: As OPKs are consumed, the available pool drops. When it falls below the `LOW_WATERMARK_THRESHOLD` (20), the server signals the client to generate and upload a new batch.
