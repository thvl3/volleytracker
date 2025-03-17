#!/bin/bash

# Navigate to the backend directory
cd "$(dirname "$0")/.."

# Create tables and initialize data
echo "Creating database tables..."
python -c "from services.db_service import db_service; db_service.create_tables_if_not_exists()"

# Initialize locations
echo "Initializing volleyball locations..."
python scripts/initialize_locations.py

echo "Database setup complete!" 