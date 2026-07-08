# Pub/Sub Architecture

The application abstracts publish-subscribe operations via the `PubSubProvider` interface.

Providers:
- `MemoryPubSub`: Local memory provider (current, suitable for 1 node).
- `RedisPubSub`: Stubbed placeholder for future distributed deployment.

Services interact with `PubSubProvider` only, ensuring business logic doesn't depend on Redis, NATS, or Kafka directly.
