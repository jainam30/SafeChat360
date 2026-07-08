# Presence Engine

## Overview
The `PresenceService` (`services/messaging/presence.py`) tracks the real-time activity state of users. 

## States
- `Online`
- `Offline`
- `Idle`
- `Typing`
- `RecordingAudio`
- `Uploading`
- `InCall`

## Event Bus Integration
Whenever a presence changes (e.g., a user starts typing), the `PresenceService` immediately publishes a `PresenceChangedEvent` or `TypingStartedEvent` to the `EventBus`. The `DeliveryService` (or a dedicated listener) subscribes to these events and broadcasts the state change to relevant peers over WebSockets.
