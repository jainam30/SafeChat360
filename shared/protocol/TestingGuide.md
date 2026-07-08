# Testing Guide (SCP)

## Comprehensive Testing Strategies
Because the Handshake Engine is decoupled, we test it exhaustively in isolation (`backend/app/protocol/tests/`).

### Replay Tests
Verify that calling `ReplayProtectionEngine.check_packet_id(id)` twice within the expiration window raises a `ValueError`.
Verify that after `time.sleep(expiration_window)`, it accepts the ID again.

### Transition Tests
Force the `HandshakeController` to process a `CapabilityExchange` while in the `CONNECTED` state (before `HandshakeInit`). Verify it raises a `ProtocolViolation` and drops the state to `CLOSED`.

### Expiration Tests
Generate a challenge nonce, alter the internal mock clock by 65 seconds, and attempt to verify it. Ensure it raises `Challenge expired`.
