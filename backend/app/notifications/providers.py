from abc import ABC, abstractmethod
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class NotificationProvider(ABC):
    @abstractmethod
    async def send(self, user_id: int, title: str, message: str, data: Dict[str, Any] = None) -> bool:
        pass

class InAppProvider(NotificationProvider):
    async def send(self, user_id: int, title: str, message: str, data: Dict[str, Any] = None) -> bool:
        logger.info(f"InAppProvider: Sending to user {user_id}: {title}")
        # In a real scenario, this writes to the Notification table via a repository
        # and optionally triggers a websocket event.
        return True

class EmailProvider(NotificationProvider):
    async def send(self, user_id: int, title: str, message: str, data: Dict[str, Any] = None) -> bool:
        logger.info(f"EmailProvider: Sending email to user {user_id}: {title}")
        # Integration with SendGrid / AWS SES / SMTP
        return True

class PushProvider(NotificationProvider):
    async def send(self, user_id: int, title: str, message: str, data: Dict[str, Any] = None) -> bool:
        logger.info(f"PushProvider: Sending push to user {user_id}: {title}")
        # Integration with Firebase Cloud Messaging (FCM) or APNS
        return True

class SMSProvider(NotificationProvider):
    async def send(self, user_id: int, title: str, message: str, data: Dict[str, Any] = None) -> bool:
        logger.info(f"SMSProvider: Sending SMS to user {user_id}: {title}")
        # Integration with Twilio or SNS
        return True
