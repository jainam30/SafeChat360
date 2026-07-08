# Session Management

## Overview
The `SessionService` intercepts standard JWT creation and injects enterprise-grade protections.

## Refresh Token Rotation
- Opaque, hashed refresh tokens are issued instead of standard JWTs for refresh tokens.
- These tokens are stored in the `CacheService`.
- If a refresh token is reused, it triggers a Replay Attack detection event and revokes the entire device session.

## Revocation
Logging out deletes the token from the cache and sets `UserSession.is_active = False` in the database.
