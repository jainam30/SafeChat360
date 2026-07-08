# Header Metadata Fields

- `header_uuid`: A globally unique identifier (simulated UUIDv7) used for deduplication and tracing.
- `session_id`: Identifies which Ratchet state to look up in the database.
- `ratchet_public_key`: The sender's *current* DH public key. If this differs from what the receiver expects, it triggers a DH Ratchet step.
- `message_number`: The index of this message in the *current* Symmetric Chain. Used to advance the chain if messages arrived out of order.
- `previous_chain_length`: Only used when the `ratchet_public_key` changes. Tells the receiver exactly how many messages they should have received in the *previous* chain before advancing the Root Key.
