from sqlmodel import Session, select
from app.db import engine
from app.models import User, Post, ModerationLog, BlockedTerm
from app.auth_utils import get_password_hash
from datetime import datetime, timedelta
import random

def seed_data():
    with Session(engine) as session:
        # 1. Create Users
        print("Creating users...")
        # Admin User
        admin = User(
            email="admin@safechat360.com",
            username="admin",
            full_name="System Admin",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            trust_score=100
        )
        
        # Regular User (Alice)
        alice = User(
            email="alice@example.com",
            username="alice",
            full_name="Alice Wonderland",
            hashed_password=get_password_hash("password123"),
            role="user",
            trust_score=95
        )

        # Regular User (Bob - Low Trust)
        bob = User(
            email="bob@example.com",
            username="bob_the_troll",
            full_name="Bob Nasty",
            hashed_password=get_password_hash("password123"),
            role="user",
            trust_score=40
        )

        session.add(admin)
        session.add(alice)
        session.add(bob)
        session.commit()
        session.refresh(admin)
        session.refresh(alice)
        session.refresh(bob)

        # 2. Create Blocked Terms
        print("Creating blocked terms...")
        terms = ["badword", "scam", "phishing"]
        for t in terms:
            term = BlockedTerm(term=t, added_by=admin.username)
            session.add(term)
        session.commit()

        # 3. Create Posts
        print("Creating social posts...")
        posts = [
            Post(content="Hello world! This is a safe post.", user_id=alice.id, is_flagged=False),
            Post(content="Check out this cool photo!", user_id=alice.id, is_flagged=False),
            Post(content="I hate everyone and this is a bad post with a badword.", user_id=bob.id, is_flagged=True, flag_reason="KEYWORD_BLOCKED"),
            Post(content="Just a normal day.", user_id=bob.id, is_flagged=False),
        ]
        for p in posts:
            session.add(p)
        session.commit()

        # 4. Create Moderation Logs (for Analytics)
        print("Creating moderation logs...")
        content_types = ["text", "image", "audio", "video"]
        
        # Generate logs for last 7 days
        for i in range(50):
            created_at = datetime.utcnow() - timedelta(days=random.randint(0, 7))
            is_flagged = random.choice([True, False, False, False]) # 25% flag rate
            c_type = random.choice(content_types)
            
            log = ModerationLog(
                content_type=c_type,
                content_excerpt=f"Sample {c_type} content...",
                is_flagged=is_flagged,
                details='{"source": "seed"}',
                source=str(random.choice([alice.id, bob.id])),
                created_at=created_at,
                original_language="en"
            )
            
            # Add some review items
            if i % 10 == 0:
                log.review_status = "pending"
                log.is_flagged = True
            
            session.add(log)
        
        session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()
