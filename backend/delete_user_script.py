from sqlmodel import Session, select, delete
from app.db import engine
from app.models import User, Post, Message, Friendship, Like, Comment, Notification, Story, UserSession, GroupMember

def delete_user_by_username(username: str):
    with Session(engine) as session:
        # Find User
        user = session.exec(select(User).where(User.username == username)).first()
        if not user:
            print(f"User '{username}' not found in the database. Nothing to delete.")
            return

        user_id = user.id
        print(f"Found user '{username}' with ID: {user_id}. proceeding with deletion...")

        # 1. Delete User Sessions
        session.exec(delete(UserSession).where(UserSession.user_id == user_id))
        print("Deleted User Sessions.")

        # 2. Delete Posts (and cascade... technically we should delete likes/comments on these posts first but let's assume simple deletion for now or rely on DB)
        # To be safe, let's just delete the user's generated content.
        session.exec(delete(Post).where(Post.user_id == user_id))
        print("Deleted Posts.")

        # 3. Delete Friendships
        session.exec(delete(Friendship).where((Friendship.user_id == user_id) | (Friendship.friend_id == user_id)))
        print("Deleted Friendships.")

        # 4. Delete Messages 
        session.exec(delete(Message).where((Message.sender_id == user_id) | (Message.receiver_id == user_id)))
        print("Deleted Messages.")

        # 5. Delete Likes
        session.exec(delete(Like).where(Like.user_id == user_id))
        print("Deleted Likes.")

        # 6. Delete Comments
        session.exec(delete(Comment).where(Comment.user_id == user_id))
        print("Deleted Comments.")

        # 7. Delete Notifications (To/From)
        session.exec(delete(Notification).where((Notification.user_id == user_id) | (Notification.source_id == user_id)))
        print("Deleted Notifications.")

        # 8. Delete Stories
        session.exec(delete(Story).where(Story.user_id == user_id))
        print("Deleted Stories.")

        # 9. Delete Group Memberships
        session.exec(delete(GroupMember).where(GroupMember.user_id == user_id))
        print("Deleted Group Memberships.")

        # Finally, Delete the User
        session.delete(user)
        session.commit()
        print(f"Successfully deleted user '{username}' and all associated data.")

if __name__ == "__main__":
    delete_user_by_username("shahdhwani500")
