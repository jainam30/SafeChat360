# Ratchet State

The `DoubleRatchetState` object is the most critical cryptographic structure in the application.

## Properties
- `root_key`: A 32-byte master key derived initially from X3DH.
- `sending_chain_key` / `receiving_chain_key`: 32-byte keys used to derive individual message encryption keys.
- `current_dh_public_key` / `current_dh_private_key`: The local DH keypair used for the current ratchet step.
- `remote_dh_public_key`: The contact's most recently known DH public key.
- `sending_message_number` / `receiving_message_number`: Sequential counters preventing message replay attacks.

## Immutability
The initialization phase establishes this state as a rigid baseline. Future ratchet operations (Phase F5.2) will produce *new* instances of the state rather than mutating this one, preventing race conditions.
