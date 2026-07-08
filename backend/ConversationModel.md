# Conversation Model

## Overview
Because the SafeChat360 database schema currently does not have a explicit `conversations` table, the `ConversationService` dynamically synthesizes a `ConversationEntity` at runtime based on the `receiver_id` or `group_id` of an incoming message.

## Types
1. **Direct**: ID format `direct:{user1}:{user2}`. IDs are sorted to ensure uniqueness regardless of who initiated the message.
2. **Group**: ID format `group:{group_id}`.
3. **System**: Global broadcast ID `system:global`.

## Future Proofing
When the architecture is ready for database migrations, we can map this `ConversationEntity` directly to a new `conversations` table without changing any of the pipeline logic.
