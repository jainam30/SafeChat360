import pytest
import asyncio
from app.events.bus import EventBus
from app.events.types import BaseEvent
from app.cache.memory import MemoryCache
from app.cache.service import CacheService
from app.features.service import FeatureFlagService
from app.queue.memory import MemoryQueue
from app.queue.service import QueueService

class DummyEvent(BaseEvent):
    event_type: str = "DummyEvent"

@pytest.mark.asyncio
async def test_event_bus():
    bus = EventBus()
    received = []
    
    def handler(event):
        received.append(event)
        
    bus.subscribe("DummyEvent", handler)
    await bus.publish(DummyEvent(payload={"test": 123}))
    
    assert len(received) == 1
    assert received[0].payload["test"] == 123

def test_cache_service():
    cache = CacheService(MemoryCache())
    cache.set("key1", "val1", ttl=10)
    
    assert cache.exists("key1")
    assert cache.get("key1") == "val1"
    
    cache.delete("key1")
    assert not cache.exists("key1")

def test_feature_flags():
    flags = FeatureFlagService()
    flags.set_flag("test_feature", enabled=True, percentage=100)
    assert flags.is_enabled("test_feature")
    
    flags.set_flag("test_feature_2", enabled=False)
    assert not flags.is_enabled("test_feature_2")

@pytest.mark.asyncio
async def test_queue_service():
    queue_provider = MemoryQueue()
    queue = QueueService(queue_provider)
    
    processed = []
    
    def worker(payload):
        processed.append(payload)
        
    queue.register_worker("test_job", worker)
    
    # Enqueue job
    job_id = await queue.enqueue("test_job", {"data": "test"})
    assert job_id is not None
    
    # Allow event loop to process
    await asyncio.sleep(0.1)
    
    assert len(processed) == 1
    assert processed[0]["data"] == "test"
