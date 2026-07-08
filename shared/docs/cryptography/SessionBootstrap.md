# Session Bootstrap Context

## The Object
The result of a successful X3DH calculation is the `SecureBootstrapContext`.
This object is the cryptographic perimeter for the session.

## Security Constraints
The `_root_secret` is explicitly marked as private. The python `__repr__` method is overridden to return `[SECRET HIDDEN]` to guarantee that an engineer writing `logger.info(f"Context: {context}")` will not accidentally leak the cryptographic key material into Datadog, ELK, or standard out.

## Lifecycle
The context is held in memory until the Double Ratchet engine (Phase F5) takes ownership of it, at which point the context is destroyed.
