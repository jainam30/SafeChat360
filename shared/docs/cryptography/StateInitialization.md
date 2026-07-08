# State Initialization Sequence

When Phase F4.2 concludes, the `X3DHEngine` outputs a `SecureBootstrapContext`.
Phase F5.1 transforms that into the `DoubleRatchetState`.

## Steps (Alice / Initiator)
1. **Root Key Initialization**: The X3DH Root Secret becomes the Double Ratchet Root Key.
2. **Chain Key Initialization**: Alice immediately derives her `SendingChainKey` because she is preparing to send the first message. Her `ReceivingChainKey` remains null until Bob responds.
3. **Counter Initialization**: `sending_message_number`, `receiving_message_number`, and `previous_chain_length` are all strictly set to `0`.
4. **DH Ratchet Initialization**: Alice generates a fresh Ephemeral DH Keypair (`RatchetPrivA`, `RatchetPubA`) to use for her first message, and records Bob's public key (`IK_B` or `SPK_B`) as the `remote_dh_public_key`.
