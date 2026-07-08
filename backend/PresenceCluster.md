# Presence Cluster

## Overview
Because WebSockets can be connected to any Node in the cluster, `PresenceService` broadcasts all state changes (`Online`, `Offline`, `Typing`) over the global `PubSubProvider`.

If a user goes offline on Node A, Node A emits `PresenceChangedEvent(offline)` across PubSub. Node B receives it and pushes the update to any of the user's friends connected to Node B.
