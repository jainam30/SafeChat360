import sqlite3
import sys

def log(msg):
    print(msg)
    sys.stdout.flush()

try:
    conn = sqlite3.connect('safechat.db')
    cursor = conn.cursor()

    log("--- SEARCH API LOGIC VERIFICATION ---")

    test_cases = [
        "jainam4",
        "Jainam4",
        " jainam4 ",
        "JAINAM4"
    ]
    
    # Simulate DB state checks
    cursor.execute("SELECT id FROM user WHERE username = 'jainam4'")
    target = cursor.fetchone()
    if not target:
        log("CRITICAL: jainam4 does not exist in DB!")
        sys.exit(1)
    target_id = target[0]

    cursor.execute("SELECT id FROM user WHERE username = 'charu'")
    me = cursor.fetchone()
    if not me:
        log("CRITICAL: charu does not exist in DB!")
        sys.exit(1)
    me_id = me[0]

    for q in test_cases:
        # Backend Logic: q.strip() then ILIKE
        clean_q = q.strip()
        
        # SQLite LIKE is case-insensitive for ASCII by default
        sql = """
            SELECT id, username FROM user 
            WHERE (username LIKE ? OR full_name LIKE ?) 
            AND id != ?
        """
        params = (f'%{clean_q}%', f'%{clean_q}%', me_id)
        
        cursor.execute(sql, params)
        results = cursor.fetchall()
        
        found = False
        for r in results:
            if r[0] == target_id:
                found = True
                break
        
        status = "✅ FOUND" if found else "❌ FAILED"
        log(f"Query: '{q}' (Cleaned: '{clean_q}') -> {status}")

except Exception as e:
    log(f"EXCEPTION: {e}")
finally:
    if 'conn' in locals():
        conn.close()
