# Error Specification

## Standard Error Codes
SCP defines rigorous error codes that map to actionable client behaviors.

| Error Code | Recoverable? | Description |
| :--- | :---: | :--- |
| `UnsupportedVersion` | No | Client's SCP version is too old for the server. |
| `InvalidPacket` | No | Schema validation failed (e.g. missing required field). |
| `CapabilityMismatch` | No | Client requires a capability the server explicitly dropped. |
| `RateLimited` | Yes | Client is sending packets too fast. Apply exponential backoff. |

## Error Packets
Errors are sent back using the `ErrorPacket` schema:
```json
{
  "protocol_version": "SCP/1.0",
  "packet_type": "ErrorPacket",
  "error_code": "RateLimited",
  "message": "Too many capability requests.",
  "is_recoverable": true
}
```
