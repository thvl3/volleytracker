import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key

class Pool:
    def __init__(self, pool_id=None, tournament_id=None, name=None, 
                 location_id=None, court_number=None, teams=None, created_at=None):
        self.pool_id = pool_id or str(uuid.uuid4())
        self.tournament_id = tournament_id
        self.name = name or "Pool"  # E.g., "Pool A", "Pool B"
        self.location_id = location_id
        self.court_number = court_number
        self.teams = teams or []  # List of team IDs
        self.created_at = created_at or int(time.time())
    
    @classmethod
    def create(cls, tournament_id, name, location_id=None, court_number=None):
        """Create a new pool"""
        pool = cls(
            tournament_id=tournament_id,
            name=name,
            location_id=location_id,
            court_number=court_number
        )
        
        # Save to DynamoDB
        db_service.pools_table.put_item(Item=pool.to_dict())
        return pool
    
    @classmethod
    def get(cls, pool_id):
        """Get a pool by ID"""
        response = db_service.pools_table.get_item(
            Key={'pool_id': pool_id}
        )
        
        item = response.get('Item')
        if not item:
            return None
            
        return cls(**item)
    
    @classmethod
    def get_by_tournament(cls, tournament_id):
        """Get all pools for a tournament"""
        try:
            response = db_service.pools_table.query(
                IndexName='TournamentPoolsIndex',
                KeyConditionExpression=Key('tournament_id').eq(tournament_id)
            )
            
            pools = []
            for item in response.get('Items', []):
                pools.append(cls(**item))
                
            return pools
        except Exception as e:
            print(f"Error querying pools: {e}")
            return []
    
    def add_team(self, team_id):
        """Add a team to the pool"""
        if team_id not in self.teams:
            self.teams.append(team_id)
            self.update()
        return self
    
    def remove_team(self, team_id):
        """Remove a team from the pool"""
        if team_id in self.teams:
            self.teams.remove(team_id)
            self.update()
        return self
    
    def update(self):
        """Update an existing pool"""
        db_service.pools_table.put_item(Item=self.to_dict())
        return self
    
    def delete(self):
        """Delete a pool"""
        db_service.pools_table.delete_item(
            Key={'pool_id': self.pool_id}
        )
    
    def to_dict(self):
        """Convert pool to dictionary"""
        return {
            'pool_id': self.pool_id,
            'tournament_id': self.tournament_id,
            'name': self.name,
            'location_id': self.location_id,
            'court_number': self.court_number,
            'teams': self.teams,
            'created_at': self.created_at
        } 