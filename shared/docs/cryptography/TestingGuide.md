# Testing Guide (Prekey Infrastructure)

## Concurrency Testing
The most critical test in Phase F4.1 is `test_opk_consumption_and_race_conditions` located in `backend/app/crypto/x3dh/tests/test_x3dh.py`.
It explicitly verifies that sequential or concurrent requests correctly exhaust the OPK pool without ever serving the same `key_id` twice.

## Execution
Run `pytest backend/app/crypto/x3dh/tests/` to validate the logic.
