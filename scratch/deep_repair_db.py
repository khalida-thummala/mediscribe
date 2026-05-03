import os
import psycopg2

DATABASE_URL = "postgresql://mediscribe_db_oe3g_user:JLnVWUUymsTDQnjB2L1WgBTZYUc3wwIf@dpg-d7qqh5gsfn5c73becj1g-a.oregon-postgres.render.com/mediscribe_db_oe3g"

def deep_inspect():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("--- Checking All Schemas for 'consultations' table ---")
        cur.execute("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'consultations';
        """)
        tables = cur.fetchall()
        for t in tables:
            schema = t[0]
            print(f"\nFound table in schema: {schema}")
            
            # Check columns in this specific schema
            cur.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = '{schema}' AND table_name = 'consultations';
            """)
            cols = [c[0] for c in cur.fetchall()]
            print(f"  Columns: {', '.join(cols)}")
            
            if 'transcription_job_id' not in cols:
                print(f"  --> transcription_job_id is MISSING in {schema}.consultations. Adding it now...")
                try:
                    cur.execute(f"ALTER TABLE {schema}.consultations ADD COLUMN transcription_job_id VARCHAR;")
                    conn.commit()
                    print(f"  --> [SUCCESS] Added to {schema}.consultations")
                except Exception as e:
                    conn.rollback()
                    print(f"  --> [FAILED] {e}")
            else:
                print(f"  --> transcription_job_id is ALREADY PRESENT in {schema}.consultations")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deep_inspect()
