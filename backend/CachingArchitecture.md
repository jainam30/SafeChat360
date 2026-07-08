# Caching Architecture

## Overview
The Cache layer is built to reduce database load and improve API latency. It abstracts the underlying storage mechanism.

## Components
- `CacheProvider`: Abstract Base Class defining standard cache operations (`get`, `set`, `delete`, `exists`, `clear`).
- `MemoryCache`: Current in-memory dictionary-based implementation (Not suitable for multi-worker production without sticky sessions, but perfect for MVP and Phase B).
- `CacheService`: Service wrapper injected into applications.

## Usage

```python
from app.deps import get_cache_service

cache = get_cache_service()
cache.set("user:1:profile", {"name": "Alice"}, ttl=3600)
profile = cache.get("user:1:profile")
```
