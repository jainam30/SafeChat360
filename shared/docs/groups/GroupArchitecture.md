# Group Architecture

The SafeChat360 Group subsystem is structurally decoupled from the cryptographic engine.

This is a deliberate architectural choice. Group administrative state (who is in the group, what their roles are) changes constantly. Cryptographic state (Multi-recipient ratchets) is highly rigid. By separating the two, we can securely manage the administrative lifecycle without risking cryptographic desynchronization.

The `GroupService` acts as the facade. It leans on the `RoleManager` to enforce hierarchy, the `MembershipManager` to handle roster changes, and the `AuditManager` to guarantee an append-only log of every administrative action.
