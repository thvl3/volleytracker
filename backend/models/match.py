import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key
from decimal import Decimal

class Match:
    def __init__(self, match_id=None, tournament_id=None, team1_id=None, team2_id=None,
                 score_team1=0, score_team2=0, status='scheduled', round_number=None,
                 match_number=None, next_match_id=None, prev_match1_id=None, prev_match2_id=None,
                 location_id=None, court_number=None, start_time=None, end_time=None,
                 bracket=None, num_sets=3, created_at=None, scores_team1=None, scores_team2=None):
        self.match_id = match_id or str(uuid.uuid4())
        self.tournament_id = tournament_id
        self.team1_id = team1_id
        self.team2_id = team2_id
        self.score_team1 = int(score_team1) if isinstance(score_team1, (str, float, Decimal)) else score_team1
        self.score_team2 = int(score_team2) if isinstance(score_team2, (str, float, Decimal)) else score_team2
        self.status = status  # 'scheduled', 'in_progress', 'completed'
        self.round_number = int(round_number) if round_number is not None and isinstance(round_number, (str, float, Decimal)) else round_number
        self.match_number = int(match_number) if match_number is not None and isinstance(match_number, (str, float, Decimal)) else match_number
        self.next_match_id = next_match_id
        self.prev_match1_id = prev_match1_id
        self.prev_match2_id = prev_match2_id
        self.location_id = location_id
        self.court_number = int(court_number) if court_number is not None and isinstance(court_number, (str, float, Decimal)) else court_number
        self.start_time = int(start_time) if start_time is not None and isinstance(start_time, (str, float, Decimal)) else start_time
        self.end_time = int(end_time) if end_time is not None and isinstance(end_time, (str, float, Decimal)) else end_time
        self.bracket = bracket  # 'Gold', 'Silver', 'Bronze'
        self.num_sets = int(num_sets) if isinstance(num_sets, (str, float, Decimal)) else num_sets
        self.created_at = created_at or int(time.time())
        self.scores_team1 = [int(s) if isinstance(s, (str, float, Decimal)) else s for s in (scores_team1 or [])] or [0] * self.num_sets
        self.scores_team2 = [int(s) if isinstance(s, (str, float, Decimal)) else s for s in (scores_team2 or [])] or [0] * self.num_sets
        self.is_pool_match = False  # Bracket matches are not pool matches
    
    @classmethod
    def create(cls, tournament_id, team1_id=None, team2_id=None, 
               scheduled_time=None, next_match_id=None, round_number=None,
               location_id=None, court_number=None, num_sets=3, match_number=None,
               bracket=None, prev_match1_id=None, prev_match2_id=None):
        """Create a new match"""
        match = cls(
            tournament_id=tournament_id,
            team1_id=team1_id,
            team2_id=team2_id,
            start_time=scheduled_time,
            next_match_id=next_match_id,
            round_number=round_number,
            location_id=location_id,
            court_number=court_number,
            num_sets=num_sets,
            match_number=match_number,
            bracket=bracket,
            prev_match1_id=prev_match1_id,
            prev_match2_id=prev_match2_id
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
                # Include all fields from the Match model
                match_data = {
                    'match_id': item.get('match_id'),
                    'tournament_id': item.get('tournament_id'),
                    'team1_id': item.get('team1_id'),
                    'team2_id': item.get('team2_id'),
                    'score_team1': item.get('score_team1', 0),
                    'score_team2': item.get('score_team2', 0),
                    'status': item.get('status', 'scheduled'),
                    'round_number': item.get('round_number'),
                    'match_number': item.get('match_number'),
                    'next_match_id': item.get('next_match_id'),
                    'prev_match1_id': item.get('prev_match1_id'),
                    'prev_match2_id': item.get('prev_match2_id'),
                    'location_id': item.get('location_id'),
                    'court_number': item.get('court_number'),
                    'start_time': item.get('start_time'),
                    'end_time': item.get('end_time'),
                    'bracket': item.get('bracket'),
                    'num_sets': item.get('num_sets', 3),
                    'created_at': item.get('created_at'),
                    'scores_team1': item.get('scores_team1', []),
                    'scores_team2': item.get('scores_team2', [])
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
            'status': self.status,
            'round_number': self.round_number,
            'match_number': self.match_number,
            'next_match_id': self.next_match_id,
            'prev_match1_id': self.prev_match1_id,
            'prev_match2_id': self.prev_match2_id,
            'location_id': self.location_id,
            'court': self.court_number,
            'court_number': self.court_number,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'bracket': self.bracket,
            'num_sets': self.num_sets,
            'created_at': self.created_at,
            'scores_team1': self.scores_team1,
            'scores_team2': self.scores_team2
        }
