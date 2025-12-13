try:
    from sqlmodel import text
    print("SUCCESS: text found in sqlmodel")
except ImportError:
    print("FAILURE: text NOT found in sqlmodel")

try:
    from sqlalchemy import text
    print("SUCCESS: text found in sqlalchemy")
except ImportError:
    print("FAILURE: text NOT found in sqlalchemy")
