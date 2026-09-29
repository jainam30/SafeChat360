import os

with open('backend/app/db.py', 'r', encoding='utf-8') as f:
    content = f.read()

bad_engine = '''engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}'''

good_engine = '''engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL pooling settings
    engine_args["pool_pre_ping"] = True
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20
    engine_args["pool_recycle"] = 300 # Recycle connections every 5 mins
    # connect_args for postgres
    engine_args["connect_args"] = {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }'''

content = content.replace(bad_engine, good_engine)
with open('backend/app/db.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed DB pooling settings")
