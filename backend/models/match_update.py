import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key

class MatchUpdate:
    def __init__(self, update_id=None, tournament_id=None, match_id=None, 
                 update_type=None, team1_id=None, team2_id=None, 
                 score_team1=None, score_team2=None, 
                 timestamp=None, team1_name=None, team2_name=None):
        self.update_id = update_id or str(uuid.uuid4())
        self.tournament_id = tournament_id
        self.match_id = match_id
        self.update_type = update_type  # 'score_update', 'match_complete'
        self.team1_id = team1_id
        self.team2_id = team2_id
        self.score_team1 = score_team1
        self.score_team2 = score_team2
        self.timestamp = timestamp or int(time.time())
        self.team1_name = team1_name  # Store team names for easier display
        self.team2_name = team2_name

    @classmethod
    def create(cls, tournament_id, match_id, update_type, team1_id=None, team2_id=None,
               score_team1=None, score_team2=None, team1_name=None, team2_name=None):
        """Create a new match update"""
        update = cls(
            tournament_id=tournament_id,
            match_id=match_id,
            update_type=update_type,
            team1_id=team1_id,
            team2_id=team2_id,
            score_team1=score_team1,
            score_team2=score_team2,
            team1_name=team1_name,
            team2_name=team2_name
        )
        
        # Save to DynamoDB
        db_service.match_updates_table.put_item(Item=update.to_dict())
        return update
    
    @classmethod
    def get_by_tournament(cls, tournament_id, since_timestamp=None, limit=20):
        """Get updates for a tournament since a given timestamp"""
        try:
            if since_timestamp:
                # Query with timestamp filter
                response = db_service.match_updates_table.query(
                    IndexName='TournamentUpdatesIndex',
                    KeyConditionExpression=Key('tournament_id').eq(tournament_id) & 
                                          Key('timestamp').gt(since_timestamp),
                    ScanIndexForward=False,  # Sort in descending order (newest first)
                    Limit=limit
                )
            else:
                # Query without timestamp filter
                response = db_service.match_updates_table.query(
                    IndexName='TournamentUpdatesIndex',
                    KeyConditionExpression=Key('tournament_id').eq(tournament_id),
                    ScanIndexForward=False,  # Sort in descending order (newest first)
                    Limit=limit
                )
            
            updates = []
            for item in response.get('Items', []):
                updates.append(cls(**item))
                
            return updates
        except Exception as e:
            print(f"Error querying match updates: {e}")
            return []
    
    def to_dict(self):
        """Convert update to dictionary"""
        return {
            'update_id': self.update_id,
            'tournament_id': self.tournament_id,
            'match_id': self.match_id,
            'update_type': self.update_type,
            'team1_id': self.team1_id,
            'team2_id': self.team2_id,
            'score_team1': self.score_team1,
            'score_team2': self.score_team2,
            'timestamp': self.timestamp,
            'team1_name': self.team1_name,
            'team2_name': self.team2_name
        } 