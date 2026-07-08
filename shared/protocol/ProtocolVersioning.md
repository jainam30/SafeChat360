# Protocol Versioning

## Upgrades without Breakage
The `protocol_version` field guarantees that we can ship `SCP/2.0` in the future without destroying `SCP/1.0` clients.
If a client sends `SCP/9.9` (which the server doesn't understand), the server immediately drops the connection with `UnsupportedVersion`.

## Packet Versioning
Certain packets (like `MessageEnvelope`) may introduce internal structural changes without bumping the global `protocol_version`. Pydantic models automatically reject unknown fields unless explicitly mapped, enforcing strict adherence to the schema.
