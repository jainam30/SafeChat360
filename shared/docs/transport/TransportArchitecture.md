# Transport Architecture

The Transport layer is designed to be completely framework agnostic. It relies on standard `asyncio` patterns but does not tightly couple to FastAPI, WebSockets, or TCP streams.

## The Gateway Pattern
The `TransportGateway` is the absolute edge of the backend infrastructure. It receives raw byte/text frames directly from the socket adapter. 

It acts as a coordinator, handing the raw string to the `PacketValidator` to ensure it is structurally safe, passing it to the `PacketRouter` to determine the business logic handler, and using the `SessionResolver` to map the ephemeral network connection ID to the persistent Cryptographic `SecureSession` ID.
