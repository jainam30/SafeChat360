# Developer Guide: Transport

When implementing the actual WebSocket server (e.g. using FastAPI or WebSockets library), follow this pattern:

```python
from app.transport.websocket.gateway import TransportGateway
# Initialize your gateway dependencies here

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connection_id = str(uuid.uuid4())
    
    await gateway.handle_connection(connection_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            await gateway.handle_receive(connection_id, data)
    except WebSocketDisconnect:
        await gateway.handle_disconnect(connection_id)
```

The gateway handles everything else (validation, routing, heartbeat, and cryptographic dispatch).
