import sqlite3
import sys

def log(msg):
    print(msg)
    sys.stdout.flush()

conn = sqlite3.connect('safechat.db')
cursor = conn.cursor()

log("--- DB CHECK ---")

# Check what email jainam4 actually has
cursor.execute("SELECT id, username, email FROM user WHERE username = 'jainam4'")
u = cursor.fetchone()
if u:
    log(f"User: {u[1]}, Email: '{u[2]}'")
else:
    log("User jainam4 NOT FOUND")

# Check exact email existence
target = "jainamjainrj@gmail.com"
cursor.execute("SELECT id, username FROM user WHERE email = ?", (target,))
t = cursor.fetchone()
if t:
    log(f"Email '{target}' belongs to username: {t[1]}")
else:
    log(f"Email '{target}' matches NO ONE.")

conn.close()
