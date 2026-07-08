from app.repositories.notification import NotificationRepository
from app.models import User
from app.core.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, notif_repo: NotificationRepository):
        self.notif_repo = notif_repo

    def get_notifications(self, current_user: User, limit: int = 50) -> list:
        notifs = self.notif_repo.get_for_user(current_user.id, limit)
        return [{
            "id": n.id,
            "type": n.type,
            "source_id": n.source_id,
            "source_name": n.source_name,
            "reference_id": n.reference_id,
            "is_read": n.is_read,
            "created_at": n.created_at
        } for n in notifs]

    def mark_read(self, notification_id: int, current_user: User) -> dict:
        notif = self.notif_repo.get(notification_id)
        if not notif:
            raise APIException(status_code=404, detail="Notification not found")
            
        if notif.user_id != current_user.id:
            raise APIException(status_code=403, detail="Not authorized")
            
        self.notif_repo.update(db_obj=notif, obj_in={"is_read": True})
        return {"status": "success", "message": "Notification marked as read"}

    def mark_all_read(self, current_user: User) -> dict:
        notifs = self.notif_repo.get_for_user(current_user.id, limit=100)
        for notif in notifs:
            if not notif.is_read:
                self.notif_repo.update(db_obj=notif, obj_in={"is_read": True})
        return {"status": "success", "message": "All notifications marked as read"}
