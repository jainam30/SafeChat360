from abc import ABC, abstractmethod
from typing import Dict, Any
from .models import MessageHeader
from ..models.state import DoubleRatchetState

class IHeaderBuilder(ABC):
    @abstractmethod
    def build(self, state: DoubleRatchetState, sender_device_id: str) -> MessageHeader:
        pass

class IHeaderValidator(ABC):
    @abstractmethod
    def validate(self, header: MessageHeader) -> bool:
        pass

class IHeaderSerializer(ABC):
    @abstractmethod
    def serialize(self, header: MessageHeader) -> bytes:
        pass

class IHeaderParser(ABC):
    @abstractmethod
    def parse(self, data: bytes) -> MessageHeader:
        pass
