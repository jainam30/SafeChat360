# Device Trust Platform

## Overview
The `DeviceService` abstracts the existing `UserSession` table to behave like a true device trust registry. It tracks `device_id`, `last_active`, and a boolean `is_active` state.

## Lifecycle
1. **Registration**: Upon login, the device is registered or updated in the trust registry.
2. **Activity**: Refresh tokens or active connections update the `last_active` timestamp.
3. **Revocation**: A user or administrator can explicitly revoke trust for a device, instantly invalidating its refresh tokens via the `SessionService` and destroying active sessions.

## Zero DB Migration Strategy
Because we cannot alter the database schema yet, fields like `user_agent` and `ip_address` are managed conceptually via API parameters and audited in JSON logs rather than strict columns.
