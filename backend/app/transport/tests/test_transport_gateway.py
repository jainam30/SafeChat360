import pytest
import asyncio
import json
from app.transport.websocket.connection_manager import ConnectionManager
from app.transport.websocket.packet_router import PacketRouter
from app.transport.sessions.resolver import SessionResolver
from app.transport.websocket.gateway import TransportGateway

@pytest.fixture
def gateway():
    manager = ConnectionManager()
    router = PacketRouter()
    resolver = SessionResolver()
    return TransportGateway(manager, router, resolver)

@pytest.mark.asyncio
async def test_gateway_connection_lifecycle(gateway):
    class MockWS:
        pass
        
    ws = MockWS()
    await gateway.handle_connection("conn_1", ws)
    
    assert gateway.connection_manager.get_connection("conn_1") == ws
    
    gateway.resolver.link("conn_1", "session_A")
    assert gateway.resolver.resolve_session("conn_1") == "session_A"
    
    await gateway.handle_disconnect("conn_1")
    assert gateway.connection_manager.get_connection("conn_1") is None
    assert gateway.resolver.resolve_session("conn_1") is None

@pytest.mark.asyncio
async def test_gateway_malformed_packet_rejection(gateway):
    class MockWS:
        pass
    await gateway.handle_connection("conn_1", MockWS())
    
    # Send totally invalid JSON
    await gateway.handle_receive("conn_1", "Not a json string")
    
    # Send valid JSON but missing 'type' and 'version'
    await gateway.handle_receive("conn_1", '{"hello": "world"}')
    
    # Send valid JSON with type but wrong version
    await gateway.handle_receive("conn_1", '{"type": "msg", "version": "0.1"}')
    
    # If the gateway raised an exception on these, the test would fail. 
    # The expected behavior is that it catches them, logs a warning, and silently drops them.

@pytest.mark.asyncio
async def test_gateway_oversized_packet_rejection(gateway):
    # Construct a string larger than 256KB
    huge_string = "A" * (300 * 1024)
    payload = json.dumps({"type": "msg", "version": "1.0", "data": huge_string})
    
    await gateway.handle_receive("conn_1", payload)
    # Expected: Silently dropped by PacketValidator size check.

@pytest.mark.asyncio
async def test_gateway_routing(gateway):
    # Track if our mock handler was called
    call_tracker = {"called": False}
    
    async def mock_handler(connection_id, data):
        call_tracker["called"] = True
        assert connection_id == "conn_1"
        assert data["type"] == "test_route"
        
    gateway.router.register_route("test_route", mock_handler)
    
    payload = json.dumps({"type": "test_route", "version": "1.0"})
    await gateway.handle_receive("conn_1", payload)
    
    assert call_tracker["called"] is True
