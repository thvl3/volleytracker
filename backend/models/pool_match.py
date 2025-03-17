import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key

class PoolMatch:
    def __init__(self, match_id=None, pool_id=None, tournament_id=None, 
                 team1_id=None, team2_id=None, scores_team1=None, scores_team2=None,
                 status='scheduled', location_id=None, court_number=None, 
                 scheduled_time=None, num_sets=2, created_at=None, is_pool_match=True):
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
        self.is_pool_match = is_pool_match
    
    @classmethod
    def create(cls, pool_id, tournament_id, team1_id, team2_id, 
               location_id=None, court_number=None, scheduled_time=None, num_sets=2, is_pool_match=True):
        """Create a new pool match"""
        match = cls(
            pool_id=pool_id,
            tournament_id=tournament_id,
            team1_id=team1_id,
            team2_id=team2_id,
            location_id=location_id,
            court_number=court_number,
            scheduled_time=scheduled_time,
            num_sets=num_sets,
            is_pool_match=is_pool_match
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
        """Get the ID of the winning team"""
        if self.status != 'completed':
            return None
            
        sets_team1 = sum(1 for s1, s2 in zip(self.scores_team1, self.scores_team2) if s1 > s2)
        sets_team2 = sum(1 for s1, s2 in zip(self.scores_team1, self.scores_team2) if s2 > s1)
        
        if sets_team1 > sets_team2:
            return self.team1_id
        elif sets_team2 > sets_team1:
            return self.team2_id
        
        return None  # Tie
    
    def get_points_differential(self, team_id):
        """Calculate points differential for a specific team"""
        if team_id == self.team1_id:
            return sum(self.scores_team1) - sum(self.scores_team2)
        elif team_id == self.team2_id:
            return sum(self.scores_team2) - sum(self.scores_team1)
        else:
            return 0  # Team not in this match
    
    def update_set_score(self, set_number, team1_score, team2_score):
        """Update the score for a specific set"""
        if set_number < 1 or set_number > self.num_sets:
            raise ValueError(f"Set number must be between 1 and {self.num_sets}")
            
        # Ensure scores lists are initialized with enough elements
        while len(self.scores_team1) < self.num_sets:
            self.scores_team1.append(0)
        while len(self.scores_team2) < self.num_sets:
            self.scores_team2.append(0)
            
        # Update scores for the specific set
        self.scores_team1[set_number - 1] = team1_score
        self.scores_team2[set_number - 1] = team2_score
        
        # Update match status based on scores
        if self._is_match_complete():
            self.status = 'completed'
        elif any(s1 > 0 or s2 > 0 for s1, s2 in zip(self.scores_team1, self.scores_team2)):
            self.status = 'in_progress'
            
        # Save changes
        self.update()
        return self
        
    def _is_match_complete(self):
        """Check if the match is complete"""
        # For pool play, all sets must be played
        return len([s for s in self.scores_team1 if s > 0]) == self.num_sets and \
               len([s for s in self.scores_team2 if s > 0]) == self.num_sets
               
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
            'created_at': self.created_at,
            'is_pool_match': self.is_pool_match
        } 