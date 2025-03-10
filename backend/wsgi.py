from app import app
from services.db_service import db_service

# Ensure tables exist
db_service.create_tables_if_not_exists()

if __name__ == "__main__":
    app.run()
