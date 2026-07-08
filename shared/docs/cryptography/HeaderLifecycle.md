# Header Lifecycle

1. **Build Phase**: Immediately before a payload is encrypted, the `HeaderBuilder` extracts the `current_dh_public_key`, `sending_message_number`, and `previous_chain_length` from the active `DoubleRatchetState`.
2. **Serialization Phase**: The `HeaderSerializer` converts the immutable object into a strictly deterministic JSON byte string.
3. **Encryption Phase (F5.5)**: The byte string is passed as Associated Data (AD) into the AES-GCM cipher alongside the plaintext payload.
4. **Parsing Phase**: The receiver's `HeaderParser` converts the incoming bytes back into a `MessageHeader` object.
5. **Validation Phase**: The `HeaderValidator` ensures the counters are mathematically possible and no timestamps are anomalously far in the future.
