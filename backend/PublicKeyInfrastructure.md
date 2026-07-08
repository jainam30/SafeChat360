# Public Key Infrastructure (PKI)

## Overview
The Backend PKI endpoints strictly map devices to their public cryptographic material. 

## Endpoints
- `POST /api/pki/keys/identity`: Uploads the base Identity and Signed Pre-Key. Enforces Device Trust policies.
- `POST /api/pki/keys/prekeys`: Bulk uploads One-Time Pre-Keys.
- `GET /api/pki/keys/device/{device_id}`: Allows any client to query another user's public keys. It pops a single OTPK from the inventory dynamically.
