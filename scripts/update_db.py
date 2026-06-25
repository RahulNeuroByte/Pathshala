import os
import sys
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text

# Add the project root to python path to import settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.config import settings

def update_database():
    print("Connecting to database using URL in .env...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Check if users table already has profile_photo column
        print("Checking users table schema...")
        result = connection.execute(text("DESCRIBE users"))
        columns = [row[0] for row in result.fetchall()]
        
        if "profile_photo" not in columns:
            print("Adding 'profile_photo' column to 'users' table...")
            # Alter table to add column
            connection.execute(text("ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) DEFAULT NULL;"))
            # In sqlalchemy 2.x, connection needs explicit commit or auto-commit behavior
            try:
                connection.commit()
            except AttributeError:
                pass
            print("Successfully added 'profile_photo' column!")
        else:
            print("'profile_photo' column already exists in 'users' table.")

if __name__ == "__main__":
    try:
        update_database()
    except Exception as e:
        print(f"Error updating database: {e}")
