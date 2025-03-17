import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key

class Match:
    def __init__(self, match_id=None, tournament_id=None, team1_id=None, team2_id=None, 
                 score_team1=0, score_team2=0, status='scheduled', court=None, 
                 scheduled_time=None, next_match_id=None, round_number=None):
        self.match_id = match_id or str(uuid.uuid4())
        self.tournament_id = tournament_id
        self.team1_id = team1_id
        self.team2_id = team2_id
        self.score_team1 = score_team1
        self.score_team2 = score_team2
        self.status = status  # 'scheduled', 'in_progress', 'completed'
        self.court = court
        self.scheduled_time = scheduled_time or int(time.time())
        self.next_match_id = next_match_id
        self.round_number = round_number
    
    @classmethod
    def create(cls, tournament_id, team1_id=None, team2_id=None, court=None, 
               scheduled_time=None, next_match_id=None, round_number=None):
        """Create a new match"""
        match = cls(
            tournament_id=tournament_id,
            team1_id=team1_id,
            team2_id=team2_id,
            court=court,
            scheduled_time=scheduled_time,
            next_match_id=next_match_id,
            round_number=round_number
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
        self.score_team1 = score_team1
        self.score_team2 = score_team2
        
        # If scores are provided, automatically set to in_progress
        if self.status == 'scheduled' and (score_team1 > 0 or score_team2 > 0):
            self.status = 'in_progress'
        
        # Update in DynamoDB
        self.update()
        return self
    
    def complete_match(self):
        """Mark match as completed and update next match if applicable"""
        self.status = 'completed'
        winner_id = self.team1_id if self.score_team1 > self.score_team2 else self.team2_id
        
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
            'court': self.court,
            'scheduled_time': self.scheduled_time,
            'next_match_id': self.next_match_id,
            'round_number': self.round_number
        }
