# Audit Policy

All group mutations are recorded by the `AuditManager` in an append-only log.

This log is critical for security investigations. If a rogue admin kicks 50 users, the audit log immutably records the `actor_id`, `target_id`, `action`, and `timestamp`. 

The `AuditManager` only provides a `get_logs()` method that returns a copy of the list. There is no `delete_log()` or `modify_log()` method, guaranteeing integrity at the application layer.
