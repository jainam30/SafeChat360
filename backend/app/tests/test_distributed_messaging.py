import pytest
import asyncio
from app.pubsub.memory import MemoryPubSub
from app.websocket.registry import ConnectionRegistry, ConnectionContext
from app.services.messaging.ordering import MessageOrderingService

@pytest.mark.asyncio
async def test_memory_pubsub():
    pubsub = MemoryPubSub()
    received = []
    
    async def handler(msg: str):
        received.append(msg)
        
    await pubsub.subscribe("test:channel", handler)
    await pubsub.publish("test:channel", "hello world")
    
    # Allow async tasks to flush
    await asyncio.sleep(0.1)
    
    assert len(received) == 1
    assert received[0] == "hello world"
    
    await pubsub.unsubscribe("test:channel")
    await pubsub.publish("test:channel", "ignored")
    await asyncio.sleep(0.1)
    assert len(received) == 1

def test_connection_registry():
    registry = ConnectionRegistry()
    ctx = ConnectionContext(None, 1, "dev1")
    
    registry.add(ctx)
    assert registry.total_count == 1
    assert len(registry.get_by_user(1)) == 1
    
    registry.remove(1, "dev1")
    assert registry.total_count == 0
    assert len(registry.get_by_user(1)) == 0

def test_message_ordering():
    ordering = MessageOrderingService()
    
    assert ordering.assign_sequence("conv1") == 1
    assert ordering.assign_sequence("conv1") == 2
    
    assert ordering.is_duplicate("msg1") is False
    ordering.mark_seen("msg1")
    assert ordering.is_duplicate("msg1") is True
