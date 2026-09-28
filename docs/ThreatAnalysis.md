# Threat Analysis: Secure Session Protocol

1. **Replay Attacks**: Mitigated by `onetime_prekey_id` reservation checks. Once consumed, the key is burnt.
2. **Downgrade Attacks**: Mitigated by `SessionPolicies` enforcing minimum protocol versions (`3.0`).
3. **Key Compromise**: The server only holds opaque handles. Real secrets are client-side.
4. **Metadata Leakage**: Metrics and events log IDs but never private keys or shared secrets.
