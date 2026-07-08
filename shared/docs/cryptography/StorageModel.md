# Storage Model

## PrekeyRepository
Abstracts the persistence layer. Currently implements an in-memory dictionary cache to prevent schema disruption during F4.1.

## Concurrency 
Uses `asyncio.Lock()` to prevent race conditions during OPK consumption. In production, this will translate to SQL `SELECT ... FOR UPDATE` or Redis Lua scripts to ensure absolute atomicity.
