# Header Validation Strategy

The `HeaderValidator` operates as the first line of defense before any cryptography is attempted.

## Rigid Rules
- Missing `ratchet_public_key` or `session_id` results in immediate rejection.
- Negative `message_number` or `previous_chain_length` results in immediate rejection.
- Timestamps located more than 1 hour into the future are rejected.
- Unknown `protocol_version` strings (not "1.0", "X3DH/1.0", "DR/1.0") are rejected.

By failing fast, we prevent an attacker from wasting server CPU cycles computing HKDFs or AES decryptions on mathematically invalid payloads.
