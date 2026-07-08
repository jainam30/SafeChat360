# Replay Protection

## Mechanism
An attacker might intercept a `ClientChallengeResponse` and try to replay it to fake a login.
The `ReplayProtectionEngine` completely neutralizes this by enforcing:
1. **Packet UUID checking**: Every `packet_id` is cached for a sliding window (e.g. 5 minutes). If a duplicate is seen, it drops the connection.
2. **Nonce expiration**: Server challenges expire in 60 seconds. A signature over an expired nonce is instantly rejected.
