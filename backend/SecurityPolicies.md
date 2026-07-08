# Security Policies

## Overview
The `PolicyService` abstracts Authorization logic out of individual FastAPI route endpoints.

## Centralized Rules
1. **Device Trust**: `enforce_trusted_device` verifies that the requesting `device_id` has an active session and hasn't been revoked.
2. **Identity Verification**: `enforce_verified_identity` ensures the user has passed necessary MFA or email verification steps.
3. **Messaging Permissions**: Evaluates blocklists, group memberships, and trust scores before permitting a message to traverse the `MessagePipeline`.
