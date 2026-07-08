# State Transitions (DH Ratchet)

## Counter Resets
Unlike the Symmetric Ratchet which strictly increments the message counters, the DH Ratchet resets them.
When a DH Ratchet step completes successfully:
1. `previous_chain_length` is set to the current `sending_message_number`.
2. `sending_message_number` is reset to `0`.
3. `receiving_message_number` is reset to `0`.

This state transition establishes the boundaries for skipped message calculation (to be implemented in future phases).
