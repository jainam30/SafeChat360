# Prekey Bundle Specification

## Structure
```json
{
  "bundle_id": "uuidv4",
  "protocol_version": "X3DH/1.0",
  "device_id": "device_uuid",
  "identity_public_key_b64": "base64",
  "signed_prekey_id": 100,
  "signed_prekey_public_b64": "base64",
  "signed_prekey_signature_b64": "base64",
  "one_time_prekey_id": 1,
  "one_time_prekey_public_b64": "base64",
  "capabilities": ["SUPPORTS_IDENTITY_KEYS"]
}
```

## Validation
`PrekeyValidator` ensures the bundle has the strict `X3DH/1.0` version and isn't missing cryptographic fields.
