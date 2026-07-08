# Out-of-Order Recovery

In distributed systems, packets arrive out of sequence constantly.

When the `SkippedKeyManager` intercepts an incoming payload, it compares the message number against the `DoubleRatchetState`.

If the incoming number is greater than expected, it delegates to the `OutOfOrderResolver`. The resolver loops over the Symmetric Ratchet Engine, calling `derive_next` for every missing message. It stores all the intermediate keys into the `SkippedKeyStore`, and returns the advanced `DoubleRatchetState` perfectly aligned to decrypt the newly arrived message.
