from pydantic import BaseModel
from typing import Dict, Any

class BasePreKeyEvent(BaseModel):
    event_type: str
    device_id: str
    payload: Dict[str, Any]

class IdentityKeyRegisteredEvent(BasePreKeyEvent):
    event_type: str = "IdentityKeyRegistered"

class SignedPreKeyRegisteredEvent(BasePreKeyEvent):
    event_type: str = "SignedPreKeyRegistered"

class SignedPreKeyRotatedEvent(BasePreKeyEvent):
    event_type: str = "SignedPreKeyRotated"

class OneTimePreKeyUploadedEvent(BasePreKeyEvent):
    event_type: str = "OneTimePreKeyUploaded"

class OneTimePreKeyReservedEvent(BasePreKeyEvent):
    event_type: str = "OneTimePreKeyReserved"

class OneTimePreKeyConsumedEvent(BasePreKeyEvent):
    event_type: str = "OneTimePreKeyConsumed"

class PreKeyPoolLowEvent(BasePreKeyEvent):
    event_type: str = "PreKeyPoolLow"

class PreKeyPoolReplenishedEvent(BasePreKeyEvent):
    event_type: str = "PreKeyPoolReplenished"
