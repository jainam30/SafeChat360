from sqlmodel import Session, select, func
from app.db import engine
from app.models import ModerationLog
import sys

def debug_stats():
    try:
        with Session(engine) as session:
            print("Querying total logs...")
            total_logs = session.exec(select(func.count(ModerationLog.id))).one()
            print(f"Total: {total_logs}")

            print("Querying flagged logs...")
            flagged_logs = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.is_flagged == True)).one()
            print(f"Flagged: {flagged_logs}")

            print("Querying text ccount...")
            text_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type == "text")).one()
            print(f"Text: {text_count}")
            
            print("Querying image count...")
            image_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type == "image")).one()
            print(f"Image: {image_count}")
            
            print("Querying video count...")
            # This 'like' might be the issue if not supported or syntax wrong
            video_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type.like("video%"))).one()
            print(f"Video: {video_count}")
            
            print("Querying audio count...")
            audio_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type == "audio")).one()
            print(f"Audio: {audio_count}")

            print("Success!")
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_stats()
