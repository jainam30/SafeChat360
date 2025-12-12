from sqlmodel import Session, select, create_engine
from app.models import User, Post, Friendship
from app.crud import create_user, create_post, get_posts, create_friendship, update_friendship_status
import os

# Use in-memory DB
sqlite_url = "sqlite:///:memory:"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    from app.models import SQLModel
    SQLModel.metadata.create_all(engine)

def verify():
    create_db_and_tables()
    
    with Session(engine) as session:
        # Create Users
        alice = create_user(session, "alice@test.com", "alice", "pass")
        bob = create_user(session, "bob@test.com", "bob", "pass")
        charlie = create_user(session, "charlie@test.com", "charlie", "pass")
        
        print(f"Users created: Alice({alice.id}), Bob({bob.id}), Charlie({charlie.id})")
        
        # Create Friendships: Alice <-> Bob
        f = create_friendship(session, alice.id, bob.id)
        update_friendship_status(session, f.id, "accepted")
        print("Friendship created: Alice <-> Bob")
        
        # Create Posts by Alice
        # 1. Public
        p1 = create_post(session, "Public Post", alice.id, alice.username, privacy="public")
        # 2. Friends Only
        p2 = create_post(session, "Friends Post", alice.id, alice.username, privacy="friends")
        # 3. Private (Only for Bob)
        p3 = create_post(session, "Private Post for Bob", alice.id, alice.username, privacy="private", allowed_users=str(bob.id))
        
        print("Posts created.")
        
        # Verify what Bob sees
        bob_posts = get_posts(session, bob.id)
        print("\n--- Bob's Feed ---")
        for p in bob_posts:
            print(f"- {p.content} (Privacy: {p.privacy})")
            
        bob_contents = [p.content for p in bob_posts]
        assert "Public Post" in bob_contents
        assert "Friends Post" in bob_contents
        assert "Private Post for Bob" in bob_contents
        print("✅ Bob sees all posts correctly.")
        
        # Verify what Charlie sees (Not a friend)
        charlie_posts = get_posts(session, charlie.id)
        print("\n--- Charlie's Feed ---")
        for p in charlie_posts:
             print(f"- {p.content} (Privacy: {p.privacy})")
             
        charlie_contents = [p.content for p in charlie_posts]
        assert "Public Post" in charlie_contents
        assert "Friends Post" not in charlie_contents
        assert "Private Post for Bob" not in charlie_contents
        print("✅ Charlie sees only public posts correctly.")

if __name__ == "__main__":
    try:
        verify()
        print("\nSUCCESS: All privacy verifications passed.")
    except Exception as e:
        print(f"\nFAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        pass
