import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Get the connection string from your .env file
# It should be the same one you used for the view_production_data.py script
# Using your direct connection string to avoid .env path issues
DATABASE_URL = "postgresql://mediscribe_db_oe3g_user:JLnVWUUymsTDQnjB2L1WgBTZYUc3wwIf@dpg-d7qqh5gsfn5c73becj1g-a.oregon-postgres.render.com/mediscribe_db_oe3g"

def repair():
    try:
        print(f"Connecting to Render Database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("Checking for missing columns in 'consultations' table...")
        
        # Add transcription_job_id
        try:
            cur.execute("ALTER TABLE consultations ADD COLUMN transcription_job_id VARCHAR;")
            print("  + Added column: transcription_job_id")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("  - Column already exists: transcription_job_id")
        except Exception as e:
            conn.rollback()
            print(f"  ! Error adding transcription_job_id: {e}")

        # Ensure transcription_confidence exists
        try:
            cur.execute("ALTER TABLE consultations ADD COLUMN transcription_confidence DECIMAL(5,2);")
            print("  + Added column: transcription_confidence")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("  - Column already exists: transcription_confidence")
        
        # Ensure transcription_status exists (if missing)
        try:
            cur.execute("ALTER TABLE consultations ADD COLUMN transcription_status VARCHAR DEFAULT 'pending';")
            print("  + Added column: transcription_status")
        except psycopg2.errors.DuplicateColumn:
            conn.rollback()
            print("  - Column already exists: transcription_status")

        # Create audit_logs table if it's missing (this is likely causing other 500s)
        print("Checking for 'audit_logs' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                log_id VARCHAR PRIMARY KEY,
                user_id VARCHAR REFERENCES users(user_id),
                organization_id VARCHAR REFERENCES organizations(organization_id),
                action VARCHAR NOT NULL,
                resource_type VARCHAR,
                resource_id VARCHAR,
                details JSONB,
                ip_address VARCHAR,
                user_agent VARCHAR,
                status VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("  + Table 'audit_logs' is now ready.")

        conn.commit()
        cur.close()
        conn.close()
        print("\n[Success] Database repair complete! Please restart your backend server.")

    except Exception as e:
        print(f"\n[Critical Error] Failed to repair database: {e}")

if __name__ == "__main__":
    repair()
