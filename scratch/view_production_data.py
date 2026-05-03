import os
import psycopg2
from psycopg2 import OperationalError

# 🛑 PASTE YOUR RENDER EXTERNAL DATABASE URL HERE 🛑
# Example: postgres://mediscribe_user:password@hostname.render.com/mediscribe_db
RENDER_DB_URL = "postgresql://mediscribe_db_oe3g_user:JLnVWUUymsTDQnjB2L1WgBTZYUc3wwIf@dpg-d7qqh5gsfn5c73becj1g-a.oregon-postgres.render.com/mediscribe_db_oe3g"

def fetch_data():
    if not RENDER_DB_URL:
        print("[Error] Please paste your Render External Database URL into the RENDER_DB_URL variable on line 6.")
        return

    print("[Connecting] Connecting to Render Production Database...")
    try:
        conn = psycopg2.connect(RENDER_DB_URL)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        if not tables:
            print("No tables found in the database.")
            return

        print(f"\n[Success] Connected! Found {len(tables)} tables.\n")
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"[Table] {table} ({count} rows)")
            
            if count > 0:
                # Fetch up to 5 rows of data to preview
                cursor.execute(f"SELECT * FROM {table} LIMIT 5")
                rows = cursor.fetchall()
                
                # Get column names
                col_names = [desc[0] for desc in cursor.description]
                
                # Convert all data to strings and truncate long strings for display
                def format_cell(val):
                    s = str(val).replace('\n', ' ')
                    return s[:30] + '...' if len(s) > 30 else s
                
                table_data = [[format_cell(col) for col in col_names]]
                for row in rows:
                    table_data.append([format_cell(cell) for cell in row])
                
                # Calculate column widths
                col_widths = [max(len(str(item)) for item in col) for col in zip(*table_data)]
                
                # Print table
                separator = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
                print(separator)
                
                for i, row in enumerate(table_data):
                    formatted_row = "| " + " | ".join(str(item).ljust(w) for item, w in zip(row, col_widths)) + " |"
                    print(formatted_row)
                    if i == 0:  # After header
                        print(separator)
                        
                print(separator)
            print()

            
        conn.close()
        print("\n[Success] Finished querying production data.")
        
    except OperationalError as e:
        print(f"[Error] Connection failed: {e}")
        print("Tip: Make sure you copied the 'External Database URL', not the Internal one.")

if __name__ == "__main__":
    fetch_data()
