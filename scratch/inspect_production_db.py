import os
import psycopg2
from dotenv import load_dotenv

# Using the direct connection string
DATABASE_URL = "postgresql://mediscribe_db_oe3g_user:JLnVWUUymsTDQnjB2L1WgBTZYUc3wwIf@dpg-d7qqh5gsfn5c73becj1g-a.oregon-postgres.render.com/mediscribe_db_oe3g"

def inspect():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("--- Table: consultations ---")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'consultations';")
        columns = cur.fetchall()
        for col in columns:
            print(f"  Column: {col[0]} ({col[1]})")

        print("\n--- Table: audit_logs ---")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs';")
        columns = cur.fetchall()
        for col in columns:
            print(f"  Column: {col[0]} ({col[1]})")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect()
