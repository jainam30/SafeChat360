# Testing Guide (Double Ratchet State)

## Scope
For Phase F5.1, the testing scope is restricted exclusively to the `DoubleRatchetInitializer`.

## Execution
Run `pytest backend/app/crypto/double_ratchet/tests/`

## Validations
- **Mathematical Lengths**: Ensure the `root_key` and `sending_chain_key` are exactly 32-bytes long upon initialization.
- **Counter Baselines**: Ensure `sending_message_number`, `receiving_message_number`, and `previous_chain_length` are exactly `0`.
- **Key Generation**: Ensure `current_dh_private_key` and `current_dh_public_key` are generated (not None) upon initialization.
- **Error Handling**: Feeding an invalid length X3DH root secret (e.g. 10 bytes instead of 32 bytes) must raise a `ValueError`.
