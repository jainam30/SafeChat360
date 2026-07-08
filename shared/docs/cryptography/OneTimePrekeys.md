# One-Time Prekeys (OPK)

## Purpose
OPKs provide forward secrecy for the very first message sent in a conversation. 

## Single-Use Enforcement
An OPK must **never** be used twice. The `PrekeyRepository` employs an asynchronous lock (`asyncio.Lock`) in Phase F4.1 to ensure atomic consumption. If Alice and Charlie both request Bob's bundle at the exact same millisecond, they will each receive a distinctly different OPK.

## Replenishment
When the pool drops below `replenishment_threshold` (e.g. 20 keys), the backend must notify the client to generate a new batch in the background.
