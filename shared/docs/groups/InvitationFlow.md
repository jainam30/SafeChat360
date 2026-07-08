# Invitation Flow

1. **Generation**: An authorized group member generates an invite. The `InvitationManager` creates a `GroupInvitation` with a 24-hour expiration.
2. **Delivery**: (Handled by application layer) The invite is sent to the target user.
3. **Acceptance**: The target user accepts. The `InvitationManager` verifies the invite is not expired and has not already been used.
4. **Enlistment**: If valid, the `MembershipManager` adds the user to the `GroupState` with the default `MEMBER` role.

The `InvitationManager` prevents Replay Attacks by explicitly transitioning the invite state from `PENDING` to `ACCEPTED`. Any subsequent attempts to accept the same invite ID will be rejected.
