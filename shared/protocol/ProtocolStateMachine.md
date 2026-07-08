# Protocol State Machine

## Finite State Automaton (DFA)
SCP connections adhere to a strict DFA to prevent sequence attacks and race conditions.

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting
    Connecting --> Negotiating
    Negotiating --> Authenticated
    Authenticated --> Ready
    Ready --> SessionPending
    SessionPending --> SessionEstablished
    SessionEstablished --> Messaging
    
    Messaging --> Closing
    Closing --> Closed
    Closed --> Connecting : Reconnect
```

## Security
If a client attempts to send a `MessageEnvelope` while in the `Negotiating` state, the `SCPStateMachine` will immediately throw a `ProtocolViolation` and drop the socket.
