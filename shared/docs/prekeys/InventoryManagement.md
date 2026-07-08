# Inventory Management

The server actively monitors the health of each device's Pre-Key pool.

If Alice is highly popular and receives 85 messages from new contacts in one day, her pool of 100 OPKs will drop to 15.

The `PreKeyManager` continuously evaluates the pool against the `LOW_WATERMARK_THRESHOLD` (20). When the count drops to 15, the next API call Alice makes will return a `needs_replenishment: true` flag.

Alice's client will then quietly generate a new batch of 100 OPKs in the background and upload them via `handle_batch_upload()`, restoring her inventory without the user ever noticing.
