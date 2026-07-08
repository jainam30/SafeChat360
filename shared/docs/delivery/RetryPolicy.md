# Retry Policy

The SafeChat360 delivery engine utilizes an Exponential Backoff policy to prevent retry storms during temporary network outages.

## Schedule
1. **Initial Send**: T = 0
2. **Attempt 1**: T = +3 seconds
3. **Attempt 2**: T = +6 seconds
4. **Attempt 3**: T = +12 seconds

## Max Retries
If an ACK is not received after the 3rd retry (total time elapsed ~21 seconds), the message transitions to `FAILED`. 

In future phases (F6.4), `FAILED` messages will be handed off to the Offline Queue for persistence until the remote client reconnects.
