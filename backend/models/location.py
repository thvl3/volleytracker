import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key
from decimal import Decimal

class Location:
    def __init__(self, location_id=None, name=None, address=None, courts=1, 
                 capacity='Medium', features=None, created_at=None):
        self.location_id = location_id or str(uuid.uuid4())
        self.name = name
        self.address = address
        self.courts = int(courts) if isinstance(courts, (str, float, Decimal)) else courts
        self.capacity = capacity  # Low, Medium, High
        self.features = features or []  # List of features/amenities
        self.created_at = created_at or int(time.time())
    
    @classmethod
    def create(cls, name, address, courts=1, capacity='Medium', features=None):
        """Create a new location"""
        location = cls(
            name=name,
            address=address,
            courts=courts,
            capacity=capacity,
            features=features
        )
        
        # Save to DynamoDB
        db_service.locations_table.put_item(Item=location.to_dict())
        return location
    
    @classmethod
    def get(cls, location_id):
        """Get a location by ID"""
        response = db_service.locations_table.get_item(
            Key={'location_id': location_id}
        )
        
        item = response.get('Item')
        if not item:
            return None
            
        return cls(**item)
    
    @classmethod
    def get_all(cls):
        """Get all locations"""
        response = db_service.locations_table.scan()
        
        locations = []
        for item in response.get('Items', []):
            locations.append(cls(**item))
            
        return locations
    
    def update(self):
        """Update an existing location"""
        db_service.locations_table.put_item(Item=self.to_dict())
        return self
    
    def delete(self):
        """Delete a location"""
        db_service.locations_table.delete_item(
            Key={'location_id': self.location_id}
        )
    
    def to_dict(self):
        """Convert location to dictionary"""
        return {
            'location_id': self.location_id,
            'name': self.name,
            'address': self.address,
            'courts': self.courts,
            'capacity': self.capacity,
            'features': self.features,
            'created_at': self.created_at
        } 