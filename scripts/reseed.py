import os
import sys
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text

# Add the project root to python path to import settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.config import settings

def reseed():
    # Connect to MySQL server (without specifying DB to drop/recreate DB)
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0]
    print(f"Connecting to MySQL server at {base_url}...")
    engine = create_engine(base_url)
    
    # Force auto-commit execution outside transaction blocks
    conn = engine.raw_connection()
    cursor = conn.cursor()
    
    try:
        print("Dropping database pathshala_db if exists...")
        cursor.execute("DROP DATABASE IF EXISTS pathshala_db;")
        print("Creating database pathshala_db...")
        cursor.execute("CREATE DATABASE pathshala_db;")
        conn.commit()
    finally:
        cursor.close()
        conn.close()
            
    # Now connect to the new pathshala_db
    print("Re-connecting to pathshala_db...")
    db_engine = create_engine(settings.DATABASE_URL)
    
    # Read schema.sql and seed_data.sql and execute them
    files_to_run = [
        ('database/schema.sql', 'schema'),
        ('database/seed_data.sql', 'seed data')
    ]
    
    with db_engine.connect() as connection:
        for filepath, name in files_to_run:
            print(f"Executing {name} ({filepath})...")
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Filter and parse queries separated by semicolons
            # Simple SQL splitting (skip empty or comment lines)
            statements = []
            current_stmt = []
            for line in content.splitlines():
                line_stripped = line.strip()
                if not line_stripped or line_stripped.startswith('--') or line_stripped.startswith('/*'):
                    continue
                current_stmt.append(line)
                if line_stripped.endswith(';'):
                    statements.append("\n".join(current_stmt))
                    current_stmt = []
            
            # Add any remaining statement
            if current_stmt:
                statements.append("\n".join(current_stmt))
                
            for statement in statements:
                stmt_clean = statement.strip()
                if stmt_clean:
                    # Remove trailing semicolon for sqlalchemy execution
                    if stmt_clean.endswith(';'):
                        stmt_clean = stmt_clean[:-1].strip()
                    if stmt_clean:
                        connection.execute(text(stmt_clean))
            
            try:
                connection.commit()
            except AttributeError:
                pass
                
    print("Database drop, recreate, schema apply, and seeding complete!")

if __name__ == "__main__":
    try:
        reseed()
    except Exception as e:
        print(f"Error during reseed: {e}")
