import uuid
from services.db_service import db_service

class Team:
    def __init__(self, team_id=None, team_name=None, tournament_id=None, players=None):
        self.team_id = team_id or str(uuid.uuid4())
        self.team_name = team_name
        self.tournament_id = tournament_id
        self.players = players or []
    
    @classmethod
    def create(cls, team_name, tournament_id, players=None):
        team = cls(
            team_name=team_name,
            tournament_id=tournament_id,
            players=players or []
        )
        
        # Save to DynamoDB
        db_service.teams_table.put_item(
            Item={
                'team_id': team.team_id,
                'team_name': team.team_name,
                'tournament_id': team.tournament_id,
                'players': team.players
            }
        )
        return team
    
    @classmethod
    def get(cls, team_id):
        response = db_service.teams_table.get_item(Key={'team_id': team_id})
        if 'Item' in response:
            return cls(**response['Item'])
        return None
    
    @classmethod
    def get_by_tournament(cls, tournament_id):
        response = db_service.teams_table.query(
            IndexName='TournamentIndex',
            KeyConditionExpression='tournament_id = :tid',
            ExpressionAttributeValues={':tid': tournament_id}
        )
        return [cls(**item) for item in response.get('Items', [])]
    
    def update(self):
        db_service.teams_table.update_item(
            Key={'team_id': self.team_id},
            UpdateExpression='SET team_name = :name, tournament_id = :tid, players = :players',
            ExpressionAttributeValues={
                ':name': self.team_name,
                ':tid': self.tournament_id,
                ':players': self.players
            }
        )
        return self
    
    def delete(self):
        db_service.teams_table.delete_item(Key={'team_id': self.team_id})
    
    def to_dict(self):
        return {
            'team_id': self.team_id,
            'team_name': self.team_name,
            'tournament_id': self.tournament_id,
            'players': self.players
        }
