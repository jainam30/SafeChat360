import json
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.models import User
from app.services.chat import ChatService
from app.services.messaging.entity import MessageEntity


class MockPubSub:
    def __init__(self):
        self.published = []

    async def publish(self, channel: str, message: str):
        self.published.append((channel, message))


class MockDeliveryService:
    def __init__(self, pubsub):
        self.pubsub = pubsub


@pytest.fixture
def test_setup():
    pubsub = MockPubSub()
    delivery = MockDeliveryService(pubsub)
    pipeline = MagicMock()
    pipeline.process = AsyncMock()
    msg_repo = MagicMock()
    user_repo = MagicMock()
    group_repo = MagicMock()
    mod_repo = MagicMock()

    service = ChatService(
        msg_repo=msg_repo,
        user_repo=user_repo,
        group_repo=group_repo,
        mod_repo=mod_repo,
        pipeline=pipeline,
        delivery=delivery,
    )
    user_alice = User(id=1, username="alice", email="alice@safechat.test", role="user")
    user_bob = User(id=2, username="bob", email="bob@safechat.test", role="user")
    return service, pubsub, pipeline, user_alice, user_bob


@pytest.mark.asyncio
async def test_webrtc_offer_forwarding(test_setup):
    service, pubsub, _, user_alice, _ = test_setup

    offer_msg = {
        "type": "offer",
        "receiver_id": 2,
        "isVideo": True,
        "sdp": {"type": "offer", "sdp": "v=0\r\no=- 12345 2 IN IP4 127.0.0.1..."},
    }

    result = await service.process_websocket_message(offer_msg, user_alice)
    assert result == {}
    assert len(pubsub.published) == 1

    channel, raw_payload = pubsub.published[0]
    assert channel == "user:2"

    payload = json.loads(raw_payload)
    assert payload["type"] == "offer"
    assert payload["msg_type"] == "offer"
    assert payload["sender_id"] == 1
    assert payload["sender_username"] == "alice"
    assert payload["receiver_id"] == 2
    assert payload["isVideo"] is True
    assert payload["sdp"] == offer_msg["sdp"]


@pytest.mark.asyncio
async def test_webrtc_answer_forwarding_and_logging(test_setup):
    service, pubsub, pipeline, _, user_bob = test_setup

    answer_msg = {
        "type": "answer",
        "receiver_id": 1,
        "isVideo": False,
        "sdp": {"type": "answer", "sdp": "v=0\r\no=- 67890 2 IN IP4 127.0.0.1..."},
    }

    result = await service.process_websocket_message(answer_msg, user_bob)
    assert result == {}
    assert len(pubsub.published) == 1

    channel, raw_payload = pubsub.published[0]
    assert channel == "user:1"

    payload = json.loads(raw_payload)
    assert payload["type"] == "answer"
    assert payload["sender_id"] == 2
    assert payload["sender_username"] == "bob"
    assert payload["receiver_id"] == 1
    assert payload["isVideo"] is False
    assert payload["sdp"] == answer_msg["sdp"]

    # Call start should be logged to pipeline
    pipeline.process.assert_awaited_once()
    logged_entity = pipeline.process.await_args[0][0]
    assert isinstance(logged_entity, MessageEntity)
    assert logged_entity.type == "call"
    assert "Voice Call Started" in logged_entity.content


@pytest.mark.asyncio
async def test_webrtc_ice_candidate_forwarding(test_setup):
    service, pubsub, _, user_alice, _ = test_setup

    candidate_msg = {
        "type": "ice-candidate",
        "receiver_id": 2,
        "candidate": {
            "candidate": "candidate:842163049 1 udp 1677729535 192.168.1.100 54321 typ host",
            "sdpMid": "0",
            "sdpMLineIndex": 0,
        },
    }

    result = await service.process_websocket_message(candidate_msg, user_alice)
    assert result == {}
    assert len(pubsub.published) == 1

    channel, raw_payload = pubsub.published[0]
    assert channel == "user:2"

    payload = json.loads(raw_payload)
    assert payload["type"] == "ice-candidate"
    assert payload["candidate"] == candidate_msg["candidate"]


@pytest.mark.asyncio
async def test_webrtc_call_rejection(test_setup):
    service, pubsub, _, _, user_bob = test_setup

    reject_msg = {
        "type": "call-response",
        "receiver_id": 1,
        "response": "rejected",
    }

    result = await service.process_websocket_message(reject_msg, user_bob)
    assert result == {}
    assert len(pubsub.published) == 1

    channel, raw_payload = pubsub.published[0]
    assert channel == "user:1"

    payload = json.loads(raw_payload)
    assert payload["type"] == "call-response"
    assert payload["response"] == "rejected"
    assert payload["sender_id"] == 2


@pytest.mark.asyncio
async def test_webrtc_hangup_forwarding_and_logging(test_setup):
    service, pubsub, pipeline, user_alice, _ = test_setup

    hangup_msg = {
        "type": "hang-up",
        "receiver_id": 2,
        "isVideo": True,
    }

    result = await service.process_websocket_message(hangup_msg, user_alice)
    assert result == {}
    assert len(pubsub.published) == 1

    channel, raw_payload = pubsub.published[0]
    assert channel == "user:2"

    payload = json.loads(raw_payload)
    assert payload["type"] == "hang-up"

    # Call end should be logged to pipeline
    pipeline.process.assert_awaited_once()
    logged_entity = pipeline.process.await_args[0][0]
    assert isinstance(logged_entity, MessageEntity)
    assert logged_entity.type == "call"
    assert "Video Call Ended" in logged_entity.content


@pytest.mark.asyncio
async def test_webrtc_self_call_rejected(test_setup):
    service, pubsub, _, user_alice, _ = test_setup

    self_call_msg = {
        "type": "offer",
        "receiver_id": 1,  # Same as current_user.id
        "sdp": {"type": "offer", "sdp": "v=0..."},
    }

    result = await service.process_websocket_message(self_call_msg, user_alice)
    assert result == {}
    # Must NOT publish to pubsub
    assert len(pubsub.published) == 0


@pytest.mark.asyncio
async def test_webrtc_missing_receiver_rejected(test_setup):
    service, pubsub, _, user_alice, _ = test_setup

    missing_recv_msg = {
        "type": "offer",
        "sdp": {"type": "offer", "sdp": "v=0..."},
    }

    result = await service.process_websocket_message(missing_recv_msg, user_alice)
    assert result == {}
    assert len(pubsub.published) == 0


@pytest.mark.asyncio
async def test_webrtc_legacy_msg_type_support(test_setup):
    service, pubsub, _, user_alice, _ = test_setup

    legacy_msg = {
        "msg_type": "offer",
        "receiver_id": 2,
        "sdp": {"type": "offer", "sdp": "v=0..."},
    }

    result = await service.process_websocket_message(legacy_msg, user_alice)
    assert result == {}
    assert len(pubsub.published) == 1
    assert pubsub.published[0][0] == "user:2"
