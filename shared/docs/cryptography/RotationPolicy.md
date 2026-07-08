# Rotation Policy

## Signed Prekeys
- Rotated automatically every 7 days.
- Previous keys remain in `RETIRED` state for 30 days to decrypt delayed offline messages.
- After 30 days, they transition to `EXPIRED` and are deleted.

## One-Time Prekeys
- Never rotated based on time.
- Consumed instantaneously upon bundle generation.
- Replenished in batches of 100 when the available pool falls below 20.
