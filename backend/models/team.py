import uuid
from services.db_service import db_service
from boto3.dynamodb.conditions import Attr, Key

class Team:
    def __init__(self, team_id=None, team_name=None, tournament_id=None, players=None):
        self.team_id = team_id or str(uuid.uuid4())
        self.team_name = team_name
        self.tournament_id = tournament_id
        self.players = players or []
    
    @classmethod
    def create(cls, team_name, tournament_id, players=None):
        """Create a new team"""
        team_id = str(uuid.uuid4())
        team = cls(
            team_id=team_id,
            team_name=team_name,
            tournament_id=tournament_id,
            players=players or []
        )
        
        # Create the item with team_id as the primary key
        item = {
            'team_id': team_id,
            'team_name': team_name,
            'tournament_id': tournament_id,
            'players': players or []
        }
        
        db_service.teams_table.put_item(Item=item)
        return team
    
    @classmethod
    def get(cls, team_id):
        """Get a team by ID"""
        response = db_service.teams_table.get_item(
            Key={'team_id': team_id}
        )
        
        item = response.get('Item')
        if not item:
            return None
            
        return cls(**item)
    
    @classmethod
    def get_all(cls, tournament_id=None):
        """Get all teams, optionally filtered by tournament_id"""
        if tournament_id:
            # Use the global secondary index for efficient queries by tournament_id
            response = db_service.teams_table.query(
                IndexName='TournamentTeamsIndex',
                KeyConditionExpression=Key('tournament_id').eq(tournament_id)
            )
        else:
            # Scan for all teams
            response = db_service.teams_table.scan()
        
        teams = []
        for item in response.get('Items', []):
            # Clean any keys that aren't part of the Team model
            team_data = {
                'team_id': item.get('team_id'),
                'team_name': item.get('team_name'),
                'tournament_id': item.get('tournament_id'),
                'players': item.get('players', [])
            }
            teams.append(cls(**team_data))
            
        return teams
    
    @classmethod
    def update(cls, team):
        """Update a team"""
        item = {
            'team_id': team.team_id,
            'team_name': team.team_name,
            'tournament_id': team.tournament_id,
            'players': team.players
        }
        
        db_service.teams_table.put_item(Item=item)
        return team
    
    def delete(self):
        """Delete a team"""
        db_service.teams_table.delete_item(
            Key={'team_id': self.team_id}
        )
    
    def to_dict(self):
        """Convert team to dictionary"""
        return {
            'team_id': self.team_id,
            'team_name': self.team_name,
            'tournament_id': self.tournament_id,
            'players': self.players
        }
