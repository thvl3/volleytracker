import uuid
import time
import logging
from services.db_service import DynamoDBService
from boto3.dynamodb.conditions import Key
from decimal import Decimal

logger = logging.getLogger(__name__)
db_service = DynamoDBService()

class PoolMatch:
    def __init__(self, match_id, pool_id, tournament_id, team1_id, team2_id, scores_team1=None, scores_team2=None,
                 status='scheduled', location_id=None, court_number=None, scheduled_time=None, num_sets=2, created_at=None):
        self.match_id = match_id
        self.pool_id = pool_id
        self.tournament_id = tournament_id
        self.team1_id = team1_id
        self.team2_id = team2_id
        # Convert scores from Decimal to int if needed
        self.scores_team1 = [int(s) if isinstance(s, (str, float, Decimal)) else s for s in (scores_team1 or [])]
        self.scores_team2 = [int(s) if isinstance(s, (str, float, Decimal)) else s for s in (scores_team2 or [])]
        self.status = status
        self.location_id = location_id
        self.court_number = int(court_number) if court_number is not None and isinstance(court_number, (str, float, Decimal)) else court_number
        self.scheduled_time = int(scheduled_time) if scheduled_time is not None and isinstance(scheduled_time, (str, float, Decimal)) else scheduled_time or int(time.time())
        self.num_sets = int(num_sets) if isinstance(num_sets, (str, float, Decimal)) else num_sets
        self.created_at = int(created_at) if created_at is not None and isinstance(created_at, (str, float, Decimal)) else created_at or int(time.time())

    @classmethod
    def create(cls, pool_id, tournament_id, team1_id, team2_id, num_sets=2, location_id=None, court_number=None, scheduled_time=None):
        match_id = str(uuid.uuid4())
        match = cls(
            match_id=match_id,
            pool_id=pool_id,
            tournament_id=tournament_id,
            team1_id=team1_id,
            team2_id=team2_id,
            scores_team1=[0] * num_sets,
            scores_team2=[0] * num_sets,
            status='scheduled',
            location_id=location_id,
            court_number=court_number,
            scheduled_time=scheduled_time,
            num_sets=num_sets
        )
        match.update()
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
        """
        Update the score for a specific set in the match
        
        Args:
            set_number (int): The set number to update (1-based index)
            team1_score (int): Score for team 1
            team2_score (int): Score for team 2
        
        Returns:
            PoolMatch: The updated match
        """
        # Validate set number is within range
        if set_number < 1 or set_number > self.num_sets:
            raise ValueError(f"Set number {set_number} is invalid. Must be between 1 and {self.num_sets}")
            
        # Initialize score arrays if they don't exist yet
        if not self.scores_team1 or len(self.scores_team1) < self.num_sets:
            self.scores_team1 = [0] * self.num_sets
            
        if not self.scores_team2 or len(self.scores_team2) < self.num_sets:
            self.scores_team2 = [0] * self.num_sets
            
        # Convert scores to integers
        team1_score = int(team1_score)
        team2_score = int(team2_score)
            
        # Update scores for the specified set
        self.scores_team1[set_number - 1] = team1_score
        self.scores_team2[set_number - 1] = team2_score
        
        # Check if match is complete and update status
        if self._is_match_complete():
            self.status = 'completed'
        else:
            self.status = 'in_progress'
            
        # Save changes to the database
        self.update()
        
        # Update pool standings
        from models.pool_standing import PoolStanding
        
        # Update team 1 standings
        standing1 = PoolStanding.get_by_team_and_pool(self.team1_id, self.pool_id)
        if standing1:
            standing1.update_stats(match_result=self)
            
        # Update team 2 standings
        standing2 = PoolStanding.get_by_team_and_pool(self.team2_id, self.pool_id)
        if standing2:
            standing2.update_stats(match_result=self)
            
        return self
        
    def _is_match_complete(self):
        """Check if all sets have been played"""
        if not self.scores_team1 or not self.scores_team2:
            return False
            
        # Check if all sets have a score
        for i in range(self.num_sets):
            if self.scores_team1[i] == 0 and self.scores_team2[i] == 0:
                # This set hasn't been played yet
                return False
                
        return True
        
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