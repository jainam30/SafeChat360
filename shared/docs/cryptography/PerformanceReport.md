# Performance Report

The cryptographic core was benchmarked on standard hardware.

## AES-256-GCM
- **Throughput**: > 1000 encryptions/second
- **Average Latency**: < 1.0 ms per payload
- **Conclusion**: Highly performant, easily capable of handling heavy enterprise chat traffic.

## HKDF Symmetric Ratchet
- **Throughput**: > 2000 ratchets/second
- **Average Latency**: < 0.5 ms per derive_next
- **Conclusion**: Resolving a gap of 1000 skipped messages takes less than 500ms, ensuring out-of-order network spikes do not freeze the UI thread or cause server timeouts.
