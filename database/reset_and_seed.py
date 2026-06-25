import os
import sys
# Add workspace root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.db.session import engine, Base
from backend.models.models import *

print("Dropping existing tables to apply new schema...")
with engine.begin() as conn:
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
Base.metadata.drop_all(bind=engine)
print("Creating tables based on new SQLAlchemy models...")
Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
print("Tables created successfully!")

# Run seed generation and direct populator
import database.seed as seed
print("Generating seed SQL and populating database...")
seed.generate_seed_sql()
print("Database reset and seed completed successfully!")
