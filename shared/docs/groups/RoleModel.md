# Role Model

SafeChat360 uses a strict hierarchical role system:

1. **OWNER** (Level 40): Created the group. Can kick anyone. Cannot be kicked.
2. **ADMIN** (Level 30): Can kick Moderators and Members. Can promote Members to Moderators.
3. **MODERATOR** (Level 20): Can kick Members. Cannot change roles.
4. **MEMBER** (Level 10): Cannot kick anyone. Cannot change roles. Can send messages.

## Enforcement
The `RoleManager` enforces these rules mathematically using integer-based hierarchy checks before any roster mutation is allowed.
