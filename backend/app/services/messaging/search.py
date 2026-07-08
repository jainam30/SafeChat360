from abc import ABC, abstractmethod
from typing import List, Dict, Any

class MessageSearchProvider(ABC):
    @abstractmethod
    def index_message(self, message_id: int, content: str, sender_id: int, conversation_id: str, timestamp: str):
        pass

    @abstractmethod
    def search(self, query: str, user_id: int) -> List[Dict[str, Any]]:
        pass

class MessageSearchService:
    def __init__(self, provider: MessageSearchProvider = None):
        self.provider = provider
        
    def index_message(self, message_id: int, content: str, sender_id: int, conversation_id: str, timestamp: str):
        if self.provider:
            self.provider.index_message(message_id, content, sender_id, conversation_id, timestamp)
