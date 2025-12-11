import sqlite3

conn = sqlite3.connect('safechat.db')
cursor = conn.cursor()
email = "jainamjainrj@gmail.com"
cursor.execute("SELECT username FROM user WHERE email = ?", (email,))
row = cursor.fetchone()
if row:
    print(f"FOUND USERNAME: {row[0]}")
else:
    print("User not found.")
conn.close()
