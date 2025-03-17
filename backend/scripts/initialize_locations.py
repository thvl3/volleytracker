#!/usr/bin/env python
"""
Initialize sample volleyball locations in the database.
This script inserts standard volleyball gym locations in Southern LA.
"""

import sys
import os
import logging
from uuid import uuid4

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.db_service import db_service
from models.location import Location

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

LOCATIONS = [
    {
        "name": "Venice Beach Volleyball Center",
        "address": "1800 Ocean Front Walk, Venice, CA 90291",
        "courts": 4,
        "capacity": 500,
        "features": ["outdoor", "sand", "lighting", "public", "spectator_seating", "parking"]
    },
    {
        "name": "LA Sports Arena",
        "address": "3939 S Figueroa St, Los Angeles, CA 90037",
        "courts": 4,
        "capacity": 800,
        "features": ["indoor", "professional", "air_conditioning", "locker_rooms", "parking", "concessions"]
    },
    {
        "name": "Westwood Recreation Center",
        "address": "1350 S Sepulveda Blvd, Los Angeles, CA 90025",
        "courts": 2,
        "capacity": 200,
        "features": ["indoor", "community", "water_fountains", "parking"]
    },
    {
        "name": "Carson Volleyball Complex",
        "address": "600 E Carson St, Carson, CA 90745",
        "courts": 3,
        "capacity": 350,
        "features": ["indoor", "college", "locker_rooms", "parking", "water_fountains"]
    },
    {
        "name": "Long Beach State Gym",
        "address": "1250 Bellflower Blvd, Long Beach, CA 90840",
        "courts": 3,
        "capacity": 300,
        "features": ["indoor", "college", "water_fountains", "locker_rooms", "parking"]
    },
    {
        "name": "South Bay Volleyball Club",
        "address": "1701 Marine Ave, Manhattan Beach, CA 90266",
        "courts": 4,
        "capacity": 200,
        "features": ["indoor", "private", "air_conditioning", "pro_shop", "parking"]
    },
    {
        "name": "Hermosa Beach Courts",
        "address": "1 Pier Ave, Hermosa Beach, CA 90254",
        "courts": 4,
        "capacity": 400,
        "features": ["outdoor", "sand", "public", "beach", "parking_nearby"]
    },
    {
        "name": "Downey Recreation Center",
        "address": "7550 E Firestone Blvd, Downey, CA 90241",
        "courts": 2,
        "capacity": 150,
        "features": ["indoor", "community", "water_fountains", "parking"]
    }
]

def initialize_locations():
    """Initialize the sample locations in the database"""
    # Make sure the DynamoDB table exists
    db_service.create_tables_if_not_exists()
    
    # Create or update each location
    for location_data in LOCATIONS:
        try:
            # Check if location with this name already exists
            existing_locations = Location.get_all()
            existing_names = [loc.name for loc in existing_locations]
            
            if location_data["name"] in existing_names:
                logger.info(f"Location '{location_data['name']}' already exists. Skipping.")
                continue
                
            # Create new location
            location = Location.create(
                name=location_data["name"],
                address=location_data["address"],
                courts=location_data["courts"],
                capacity=location_data["capacity"],
                features=location_data["features"]
            )
            
            logger.info(f"Created location: {location.name}")
            
        except Exception as e:
            logger.error(f"Error creating location '{location_data['name']}': {str(e)}")
    
    logger.info("Location initialization complete")

if __name__ == "__main__":
    initialize_locations() 