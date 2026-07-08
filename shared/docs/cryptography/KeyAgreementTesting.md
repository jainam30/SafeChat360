# Testing Guide (X3DH Key Agreement)

## Execution
Run `pytest backend/app/crypto/x3dh/tests/test_agreement.py`

## Validation Coverage
- **Invalid Signatures**: Simulates an attacker modifying a bundle. Expects `X3DHEngine` to return `None` (Aborted).
- **Mathematical Execution**: Ensures that when given a valid bundle, `X3DHEngine` mathematically completes all 4 DH steps, performs HKDF expansion, and yields exactly 32-bytes of Root Secret.
- **Zeroization**: Verifies `EphemeralKeyManager.zeroize()` is invoked inside the `finally` block of the execution flow, guaranteeing temporary keys are destroyed regardless of failure or success.
