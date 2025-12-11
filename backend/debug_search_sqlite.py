import sqlite3
import sys

# Flush helper
def log(msg):
    print(msg)
    sys.stdout.flush()

try:
    conn = sqlite3.connect('safechat.db')
    cursor = conn.cursor()

    # Check Charu
    cursor.execute("SELECT id FROM user WHERE username = 'charu'")
    charu = cursor.fetchone()
    if not charu:
        log("ERROR: Charu not found")
        sys.exit(1)
    charu_id = charu[0]
    log(f"Charu ID: {charu_id}")

    # Check Jainam4
    cursor.execute("SELECT id FROM user WHERE username = 'jainam4'")
    jainam4 = cursor.fetchone()
    if not jainam4:
        log("ERROR: Jainam4 not found")
        sys.exit(1)
    jainam4_id = jainam4[0]
    log(f"Jainam4 ID: {jainam4_id}")

    # Simulate Search
    q = "jainam4"
    log(f"Searching for '{q}'...")
    
    # SQLite LIKE matches
    sql = """
    SELECT id, username FROM user 
    WHERE (username LIKE ? OR full_name LIKE ?) 
    AND id != ?
    LIMIT 20
    """
    params = (f'%{q}%', f'%{q}%', charu_id)
    
    cursor.execute(sql, params)
    results = cursor.fetchall()
    
    log(f"Results Found: {len(results)}")
    found = False
    for r in results:
        log(f"- {r[1]} (ID: {r[0]})")
        if r[0] == jainam4_id:
            found = True
            
    if found:
        log("SUCCESS: Jainam4 found!")
    else:
        log("FAILURE: Jainam4 NOT found")

except Exception as e:
    log(f"EXCEPTION: {e}")
finally:
    if 'conn' in locals():
        conn.close()
