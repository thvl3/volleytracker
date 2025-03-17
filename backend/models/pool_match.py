import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key

class PoolMatch:
    def __init__(self, match_id=None, pool_id=None, tournament_id=None, 
                 team1_id=None, team2_id=None, scores_team1=None, scores_team2=None,
                 status='scheduled', location_id=None, court_number=None, 
                 scheduled_time=None, num_sets=2, created_at=None):
        self.match_id = match_id or str(uuid.uuid4())
        self.pool_id = pool_id
        self.tournament_id = tournament_id
        self.team1_id = team1_id
        self.team2_id = team2_id
        self.scores_team1 = scores_team1 or []  # List of set scores, e.g. [21, 19]
        self.scores_team2 = scores_team2 or []  # List of set scores, e.g. [19, 21]
        self.status = status  # 'scheduled', 'in_progress', 'completed'
        self.location_id = location_id
        self.court_number = court_number
        self.scheduled_time = scheduled_time or int(time.time())
        self.num_sets = num_sets  # Default 2 sets for pool play
        self.created_at = created_at or int(time.time())
    
    @classmethod
    def create(cls, pool_id, tournament_id, team1_id, team2_id, 
               location_id=None, court_number=None, scheduled_time=None, num_sets=2):
        """Create a new pool match"""
        match = cls(
            pool_id=pool_id,
            tournament_id=tournament_id,
            team1_id=team1_id,
            team2_id=team2_id,
            location_id=location_id,
            court_number=court_number,
            scheduled_time=scheduled_time,
            num_sets=num_sets
        )
        
        # Save to DynamoDB
        db_service.pool_matches_table.put_item(Item=match.to_dict())
        return match
    
    @classmethod
    def get(cls, match_id):
        """Get a pool match by ID"""
        response = db_service.pool_matches_table.get_item(
            Key={'match_id': match_id}
        )
        
        item = response.get('Item')
        if not item:
            return None
            
        return cls(**item)
    
    @classmethod
    def get_by_pool(cls, pool_id):
        """Get all matches for a pool"""
        try:
            response = db_service.pool_matches_table.query(
                IndexName='PoolMatchesIndex',
                KeyConditionExpression=Key('pool_id').eq(pool_id)
            )
            
            matches = []
            for item in response.get('Items', []):
                matches.append(cls(**item))
                
            return matches
        except Exception as e:
            print(f"Error querying pool matches: {e}")
            return []
    
    @classmethod
    def get_by_team(cls, team_id, tournament_id):
        """Get all pool matches for a team in a tournament"""
        try:
            # First check for team1_id
            response1 = db_service.pool_matches_table.scan(
                FilterExpression=Key('team1_id').eq(team_id) & Key('tournament_id').eq(tournament_id)
            )
            
            # Then check for team2_id
            response2 = db_service.pool_matches_table.scan(
                FilterExpression=Key('team2_id').eq(team_id) & Key('tournament_id').eq(tournament_id)
            )
            
            matches = []
            for item in response1.get('Items', []) + response2.get('Items', []):
                matches.append(cls(**item))
                
            return matches
        except Exception as e:
            print(f"Error querying team matches: {e}")
            return []
    
    def update_scores(self, set_index, team1_score, team2_score):
        """Update scores for a specific set"""
        # Ensure lists are long enough
        while len(self.scores_team1) <= set_index:
            self.scores_team1.append(0)
        while len(self.scores_team2) <= set_index:
            self.scores_team2.append(0)
        
        self.scores_team1[set_index] = team1_score
        self.scores_team2[set_index] = team2_score
        
        # Set match to in_progress if it was scheduled
        if self.status == 'scheduled':
            self.status = 'in_progress'
        
        # Check if match is complete
        if set_index + 1 == self.num_sets:
            # All sets have been played
            self.status = 'completed'
        
        self.update()
        return self
    
    def calculate_team1_sets_won(self):
        """Calculate how many sets team1 has won"""
        return sum(1 for i in range(min(len(self.scores_team1), len(self.scores_team2))) 
                  if self.scores_team1[i] > self.scores_team2[i])
    
    def calculate_team2_sets_won(self):
        """Calculate how many sets team2 has won"""
        return sum(1 for i in range(min(len(self.scores_team1), len(self.scores_team2))) 
                  if self.scores_team2[i] > self.scores_team1[i])
    
    def get_winner_id(self):
        """Get the ID of the winning team (or None if tied or incomplete)"""
        if self.status != 'completed':
            return None
            
        team1_sets = self.calculate_team1_sets_won()
        team2_sets = self.calculate_team2_sets_won()
        
        if team1_sets > team2_sets:
            return self.team1_id
        elif team2_sets > team1_sets:
            return self.team2_id
        else:
            return None  # Tied (possible in pool play)
    
    def get_points_differential(self, team_id):
        """Calculate points differential for a specific team"""
        if team_id == self.team1_id:
            return sum(self.scores_team1) - sum(self.scores_team2)
        elif team_id == self.team2_id:
            return sum(self.scores_team2) - sum(self.scores_team1)
        else:
            return 0  # Team not in this match
    
    def update(self):
        """Update an existing pool match"""
        db_service.pool_matches_table.put_item(Item=self.to_dict())
        return self
    
    def delete(self):
        """Delete a pool match"""
        db_service.pool_matches_table.delete_item(
            Key={'match_id': self.match_id}
        )
    
    def to_dict(self):
        """Convert pool match to dictionary"""
        return {
            'match_id': self.match_id,
            'pool_id': self.pool_id,
            'tournament_id': self.tournament_id,
            'team1_id': self.team1_id,
            'team2_id': self.team2_id,
            'scores_team1': self.scores_team1,
            'scores_team2': self.scores_team2,
            'status': self.status,
            'location_id': self.location_id,
            'court_number': self.court_number,
            'scheduled_time': self.scheduled_time,
            'num_sets': self.num_sets,
            'created_at': self.created_at
        } 