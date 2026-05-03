import sqlite3
import os

db_path = "backend/mediscribe.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("--- Tables ---")
    for table in tables:
        print(table[0])
        
    # Show row counts
    print("\n--- Row Counts ---")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]};")
        count = cursor.fetchone()[0]
        print(f"{table[0]}: {count} rows")
    
    conn.close()
