# Replay Handling via Exactly-Once Consumption

Replay attacks occur when a malicious actor intercepts a valid encrypted packet and sends it to the receiver a second time.

SafeChat360 defeats replays at the Symmetric Ratchet level using **Exactly-Once Consumption**.

When a delayed message arrives (e.g. Message #3), the `SkippedKeyManager` queries the `SkippedKeyStore`.
The store locates the key, returns it to the manager, and **atomically deletes it from memory**.

If the attacker replays Message #3 five seconds later, the manager queries the store again. Because the key was deleted during the first successful decryption, the query returns `None`. The manager instantly recognizes this as a replay attempt and drops the packet.
