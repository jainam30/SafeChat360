# Group Threat Model

## Unauthorized Joins
**Threat**: A user tries to force their way into a group by bypassing the invite system.
**Mitigation**: The `MembershipManager` will only add a user if explicitly authorized by an Admin or through a valid, cryptographically random `invite_id` validated by the `InvitationManager`.

## Privilege Escalation
**Threat**: A standard Member attempts to promote themselves to Admin.
**Mitigation**: The `RoleManager` enforces a strict numerical hierarchy. A user can only grant roles that are *strictly less* than their own privilege level.

## Invite Replay
**Threat**: A user intercepts an invite link and tries to use it multiple times, or share it with others.
**Mitigation**: Invites are explicitly tied to an `invitee_id`. If someone else tries to use it, the `InvitationManager` rejects it. If the intended user tries to use it twice, the `status` check fails.

## Audit Tampering
**Threat**: A rogue Admin kicks someone and then tries to delete the log.
**Mitigation**: The `AuditManager` is strictly append-only.
