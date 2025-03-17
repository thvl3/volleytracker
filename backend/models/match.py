import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key

class Match:
    def __init__(self, match_id=None, tournament_id=None, team1_id=None, team2_id=None, 
                 score_team1=0, score_team2=0, status='scheduled', court=None, 
                 scheduled_time=None, next_match_id=None, round_number=None,
                 location_id=None, court_number=None, scores_team1=None, scores_team2=None,
                 num_sets=3, is_pool_match=False):
        self.match_id = match_id or str(uuid.uuid4())
        self.tournament_id = tournament_id
        self.team1_id = team1_id
        self.team2_id = team2_id
        self.score_team1 = score_team1  # Legacy field for total score
        self.score_team2 = score_team2  # Legacy field for total score
        self.scores_team1 = scores_team1 or []  # Scores by set for team1
        self.scores_team2 = scores_team2 or []  # Scores by set for team2
        self.status = status  # 'scheduled', 'in_progress', 'completed'
        self.court = court  # Legacy field
        self.location_id = location_id  # New field - references Location object
        self.court_number = court_number  # Specific court number within location
        self.scheduled_time = scheduled_time or int(time.time())
        self.next_match_id = next_match_id
        self.round_number = round_number
        self.num_sets = num_sets  # Number of sets to be played (2 for pool, 3 for bracket)
        self.is_pool_match = is_pool_match  # Whether this is a pool match or bracket match
    
    @classmethod
    def create(cls, tournament_id, team1_id=None, team2_id=None, court=None, 
               scheduled_time=None, next_match_id=None, round_number=None,
               location_id=None, court_number=None, num_sets=None, is_pool_match=False):
        """Create a new match"""
        match = cls(
            tournament_id=tournament_id,
            team1_id=team1_id,
            team2_id=team2_id,
            court=court,
            location_id=location_id,
            court_number=court_number,
            scheduled_time=scheduled_time,
            next_match_id=next_match_id,
            round_number=round_number,
            num_sets=num_sets,
            is_pool_match=is_pool_match
        )
        
        # Save to DynamoDB
        db_service.matches_table.put_item(Item=match.to_dict())
        return match
    
    @classmethod
    def get(cls, match_id):
        """Get a match by ID"""
        response = db_service.matches_table.get_item(
            Key={'match_id': match_id}
        )
        
        item = response.get('Item')
        if not item:
            return None
            
        return cls(**item)
    
    @classmethod
    def get_by_tournament_status(cls, tournament_id, status=None):
        """Get matches for a tournament, optionally filtered by status"""
        try:
            if status:
                # Use the TournamentStatusIndex when filtering by both tournament and status
                response = db_service.matches_table.query(
                    IndexName='TournamentStatusIndex',
                    KeyConditionExpression=Key('tournament_id').eq(tournament_id) & 
                                          Key('status').eq(status)
                )
            else:
                # Use the TournamentMatchesIndex when filtering only by tournament
                response = db_service.matches_table.query(
                    IndexName='TournamentMatchesIndex',
                    KeyConditionExpression=Key('tournament_id').eq(tournament_id)
                )
            
            matches = []
            for item in response.get('Items', []):
                # Clean any keys that aren't part of the Match model
                match_data = {
                    'match_id': item.get('match_id'),
                    'tournament_id': item.get('tournament_id'),
                    'team1_id': item.get('team1_id'),
                    'team2_id': item.get('team2_id'),
                    'score_team1': item.get('score_team1', 0),
                    'score_team2': item.get('score_team2', 0),
                    'status': item.get('status', 'scheduled'),
                    'court': item.get('court'),
                    'scheduled_time': item.get('scheduled_time'),
                    'next_match_id': item.get('next_match_id'),
                    'round_number': item.get('round_number')
                }
                matches.append(cls(**match_data))
                
            return matches
        except Exception as e:
            print(f"Error querying matches: {e}")
            # Fall back to scan if there's an issue with the GSI
            return []
    
    def update(self):
        """Update a match"""
        db_service.matches_table.put_item(Item=self.to_dict())
        return self
    
    def update_score(self, score_team1, score_team2):
        """Update match scores and potentially status"""
        self.score_team1 = int(score_team1)
        self.score_team2 = int(score_team2)
        
        # If scores are provided, automatically set to in_progress
        if self.status == 'scheduled' and (self.score_team1 > 0 or self.score_team2 > 0):
            self.status = 'in_progress'
        
        # Update in DynamoDB
        self.update()
        return self
    
    def complete_match(self):
        """Mark match as completed and update next match if applicable"""
        self.status = 'completed'
        winner_id = self.team1_id if int(self.score_team1) > int(self.score_team2) else self.team2_id
        
        # Update the next match in the bracket if it exists
        if self.next_match_id:
            next_match = Match.get(self.next_match_id)
            if next_match:
                # Assuming first empty slot gets filled first
                if not next_match.team1_id:
                    next_match.team1_id = winner_id
                elif not next_match.team2_id:
                    next_match.team2_id = winner_id
                next_match.update()
        
        # Update this match status
        self.update()
        return self
    
    def delete(self):
        """Delete a match"""
        db_service.matches_table.delete_item(
            Key={'match_id': self.match_id}
        )
    
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
        
        # Update legacy score fields with total scores
        self.score_team1 = sum(1 for s1, s2 in zip(self.scores_team1, self.scores_team2) if s1 > s2)
        self.score_team2 = sum(1 for s1, s2 in zip(self.scores_team1, self.scores_team2) if s2 > s1)
        
        # Update match status based on scores
        if self._is_match_complete():
            self.status = 'completed'
            
            # If this match feeds into another match, update the next match
            if self.next_match_id:
                self._advance_winner()
        elif any(s1 > 0 or s2 > 0 for s1, s2 in zip(self.scores_team1, self.scores_team2)):
            self.status = 'in_progress'
            
        # Save changes
        self.update()
        return self
        
    def _is_match_complete(self):
        """Check if the match is complete based on sets won"""
        # For pool play (typically 2 sets)
        if self.is_pool_match:
            return len([s for s in self.scores_team1 if s > 0]) == self.num_sets and \
                   len([s for s in self.scores_team2 if s > 0]) == self.num_sets
                   
        # For bracket play (best 2 out of 3)
        sets_to_win = (self.num_sets + 1) // 2  # 2 for a 3-set match
        sets_team1 = sum(1 for s1, s2 in zip(self.scores_team1, self.scores_team2) if s1 > s2)
        sets_team2 = sum(1 for s1, s2 in zip(self.scores_team1, self.scores_team2) if s2 > s1)
        
        return sets_team1 >= sets_to_win or sets_team2 >= sets_to_win
    
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
    
    def _advance_winner(self):
        """Advance the winner to the next match"""
        if not self.next_match_id or self.status != 'completed':
            return
            
        winner_id = self.get_winner_id()
        if not winner_id:
            return
            
        next_match = Match.get(self.next_match_id)
        if not next_match:
            return
            
        # Assign the winner to the next match
        if not next_match.team1_id:
            next_match.team1_id = winner_id
        else:
            next_match.team2_id = winner_id
            
        next_match.update()
        
    def update_court(self, location_id, court_number):
        """Update the court assignment for a match"""
        self.location_id = location_id
        self.court_number = court_number
        self.update()
        return self
    
    def to_dict(self):
        """Convert match to dictionary"""
        return {
            'match_id': self.match_id,
            'tournament_id': self.tournament_id,
            'team1_id': self.team1_id,
            'team2_id': self.team2_id,
            'score_team1': self.score_team1,
            'score_team2': self.score_team2,
            'scores_team1': self.scores_team1,
            'scores_team2': self.scores_team2,
            'status': self.status,
            'court': self.court,
            'location_id': self.location_id,
            'court_number': self.court_number,
            'scheduled_time': self.scheduled_time,
            'next_match_id': self.next_match_id,
            'round_number': self.round_number,
            'num_sets': self.num_sets,
            'is_pool_match': self.is_pool_match
        }
