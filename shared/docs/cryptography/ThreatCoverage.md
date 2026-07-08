# Threat Coverage Map

| Threat | Subsystem | Verification Test | Result |
|--------|-----------|-------------------|--------|
| Plaintext memory leak | AEAD Encryption | `test_memory_security.py` | Defeated via `finally: del` |
| Ciphertext Bit-flip | AEAD Decryption | `test_aead_fuzzing.py` | Defeated via MAC |
| Replay Attack | Skipped Key Store | `test_replay_and_gaps.py` | Defeated via exactly-once consumption |
| Server Crash (Cache) | OutOfOrderResolver | `test_replay_and_gaps.py` | Defeated via `max_gap` boundary |
| Metadata Tampering | Associated Data | `test_aead_decryption_tampered_header` | Defeated via AAD Binding |
