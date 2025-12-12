import sqlite3

def inspect_schema():
    try:
        conn = sqlite3.connect('safechat.db')
        cursor = conn.cursor()
        
        # Get columns for 'message' table
        cursor.execute("PRAGMA table_info(message)")
        columns = cursor.fetchall()
        
        print("Schema for 'message' table:")
        found_group_id = False
        for col in columns:
            print(col)
            if col[1] == 'group_id':
                found_group_id = True
                
        if found_group_id:
            print("\nSUCCESS: 'group_id' column FOUND.")
        else:
            print("\nFAILURE: 'group_id' column MISSING.")

        conn.close()
    except Exception as e:
        print(f"Error inspecting DB: {e}")

if __name__ == "__main__":
    inspect_schema()
