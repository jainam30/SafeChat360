import pytest
from app.protocol.state_machine.machine import SCPStateMachine, ProtocolState
from app.protocol.validation.validator import PacketValidator
from app.protocol.errors.codes import ProtocolException, SCPErrorCode
from app.protocol.capabilities.flags import CapabilityNegotiator, ProtocolCapability
import json

def test_state_machine_valid_transition():
    machine = SCPStateMachine()
    assert machine.state == ProtocolState.DISCONNECTED
    
    machine.transition(ProtocolState.CONNECTING)
    assert machine.state == ProtocolState.CONNECTING
    
    machine.transition(ProtocolState.NEGOTIATING)
    assert machine.state == ProtocolState.NEGOTIATING

def test_state_machine_invalid_transition():
    machine = SCPStateMachine()
    with pytest.raises(ValueError):
        # Cannot jump from Disconnected straight to Ready
        machine.transition(ProtocolState.READY)

def test_validator_valid_json():
    raw = json.dumps({
        "protocol_version": "SCP/1.0",
        "packet_type": "HandshakeInit",
        "packet_id": "req-1",
        "client_version": "v1.0.0",
        "device_id": "dev-123"
    })
    packet = PacketValidator.validate_raw(raw)
    assert packet.packet_id == "req-1"

def test_validator_invalid_version():
    raw = json.dumps({
        "protocol_version": "SCP/2.0",
        "packet_type": "HandshakeInit",
        "packet_id": "req-1",
        "client_version": "v1.0.0",
        "device_id": "dev-123"
    })
    with pytest.raises(ProtocolException) as excinfo:
        PacketValidator.validate_raw(raw)
    assert excinfo.value.code == SCPErrorCode.MALFORMED_PACKET

def test_capability_negotiation():
    client_caps = ["SUPPORTS_IDENTITY_KEYS", "FAKE_FEATURE"]
    intersection = CapabilityNegotiator.intersect(client_caps)
    assert "SUPPORTS_IDENTITY_KEYS" in intersection
    assert "FAKE_FEATURE" not in intersection
