# Reservation Protocol

The `PreKeyReservationService` implements a strict reservation pattern to prevent race conditions when two different senders try to start a session with the same offline recipient simultaneously.

## The Atomic Lock
When a bundle is requested, the service acquires a thread lock (or database transaction lock) for that specific `device_id`.
It finds the first `ACTIVE` one-time pre-key.
It transitions it to `RESERVED` and attaches a 5-minute timeout.
It releases the lock.

If a second sender requests a bundle 1 millisecond later, they will receive the *next* `ACTIVE` key in the pool.

## Timeout
If the first sender fails to actually establish the session (e.g. they lose internet immediately after fetching the bundle), the reservation expires after 5 minutes, and the key returns to the `ACTIVE` pool to prevent inventory exhaustion.
