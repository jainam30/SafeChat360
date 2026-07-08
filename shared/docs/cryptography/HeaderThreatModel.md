# Header Threat Model

## Metadata Tampering
**Threat**: An attacker modifies the `message_number` or `previous_chain_length` in transit to force the receiver to derive the wrong keys, causing a denial of service.
**Mitigation**: The serialization is deterministic. In Phase F5.5, this exact byte string will be authenticated by the AEAD cipher. Any modification to the metadata will cause the decryption to fail mathematically.

## Replay Attacks
**Threat**: An attacker replays an old packet.
**Mitigation**: The `header_uuid` prevents blind replays, and the combination of `ratchet_public_key` and `message_number` allows the receiver to detect that they have already processed this specific index in the ratchet chain.

## Future Anomalies
**Threat**: An attacker injects a header with a timestamp set to the year 2099 to corrupt the database timeline.
**Mitigation**: The `HeaderValidator` explicitly rejects headers with timestamps anomalously far in the future.
