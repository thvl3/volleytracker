import uuid
import time
from services.db_service import db_service
from boto3.dynamodb.conditions import Key

class PoolStanding:
    def __init__(self, standing_id=None, pool_id=None, tournament_id=None, team_id=None,
                 wins=0, losses=0, ties=0, sets_won=0, sets_lost=0, 
                 points_scored=0, points_allowed=0, rank=None, created_at=None):
        self.standing_id = standing_id or str(uuid.uuid4())
        self.pool_id = pool_id
        self.tournament_id = tournament_id
        self.team_id = team_id
        self.wins = wins
        self.losses = losses
        self.ties = ties
        self.sets_won = sets_won
        self.sets_lost = sets_lost
        self.points_scored = points_scored
        self.points_allowed = points_allowed
        self.rank = rank  # Final ranking in the pool (1st, 2nd, 3rd, 4th)
        self.created_at = created_at or int(time.time())
    
    @classmethod
    def create(cls, pool_id, tournament_id, team_id):
        """Create a new pool standing for a team"""
        standing = cls(
            pool_id=pool_id,
            tournament_id=tournament_id,
            team_id=team_id
        )
        
        # Save to DynamoDB
        db_service.pool_standings_table.put_item(Item=standing.to_dict())
        return standing
    
    @classmethod
    def get(cls, standing_id):
        """Get a pool standing by ID"""
        response = db_service.pool_standings_table.get_item(
            Key={'standing_id': standing_id}
        )
        
        item = response.get('Item')
        if not item:
            return None
            
        return cls(**item)
    
    @classmethod
    def get_by_team_and_pool(cls, team_id, pool_id):
        """Get a standing for a team in a specific pool"""
        try:
            response = db_service.pool_standings_table.scan(
                FilterExpression=Key('team_id').eq(team_id) & Key('pool_id').eq(pool_id)
            )
            
            items = response.get('Items', [])
            if not items:
                return None
                
            return cls(**items[0])
        except Exception as e:
            print(f"Error getting team standing: {e}")
            return None
    
    @classmethod
    def get_by_pool(cls, pool_id):
        """Get all standings for a pool"""
        try:
            response = db_service.pool_standings_table.query(
                IndexName='PoolStandingsIndex',
                KeyConditionExpression=Key('pool_id').eq(pool_id)
            )
            
            standings = []
            for item in response.get('Items', []):
                standings.append(cls(**item))
                
            # Sort by rank (if assigned) or by win percentage
            standings.sort(key=lambda s: (
                s.rank or float('inf'),  # Sort by rank first if available
                -(s.wins / max(1, s.wins + s.losses + s.ties)),  # Then by win percentage (descending)
                -(s.sets_won / max(1, s.sets_won + s.sets_lost)),  # Then by sets win percentage
                -(s.points_scored - s.points_allowed)  # Then by point differential
            ))
                
            return standings
        except Exception as e:
            print(f"Error querying pool standings: {e}")
            return []
    
    def update_stats(self, match_result):
        """Update standings based on a match result"""
        if match_result.team1_id == self.team_id:
            # Team being updated was team1 in the match
            self.sets_won += match_result.calculate_team1_sets_won()
            self.sets_lost += match_result.calculate_team2_sets_won()
            self.points_scored += sum(match_result.scores_team1)
            self.points_allowed += sum(match_result.scores_team2)
            
            # Update W/L/T record
            if match_result.get_winner_id() == self.team_id:
                self.wins += 1
            elif match_result.get_winner_id() is None:
                self.ties += 1
            elif match_result.get_winner_id() != self.team_id:
                self.losses += 1
                
        elif match_result.team2_id == self.team_id:
            # Team being updated was team2 in the match
            self.sets_won += match_result.calculate_team2_sets_won()
            self.sets_lost += match_result.calculate_team1_sets_won()
            self.points_scored += sum(match_result.scores_team2)
            self.points_allowed += sum(match_result.scores_team1)
            
            # Update W/L/T record
            if match_result.get_winner_id() == self.team_id:
                self.wins += 1
            elif match_result.get_winner_id() is None:
                self.ties += 1
            elif match_result.get_winner_id() != self.team_id:
                self.losses += 1
        
        self.update()
        return self
    
    def assign_rank(self, rank):
        """Assign a final rank to this team in the pool"""
        self.rank = rank
        self.update()
        return self
    
    def get_points_differential(self):
        """Get the points differential for this team"""
        return self.points_scored - self.points_allowed
    
    def get_win_percentage(self):
        """Get the win percentage for this team"""
        total_matches = self.wins + self.losses + self.ties
        if total_matches == 0:
            return 0
        return (self.wins + (0.5 * self.ties)) / total_matches
    
    def update(self):
        """Update an existing pool standing"""
        db_service.pool_standings_table.put_item(Item=self.to_dict())
        return self
    
    def delete(self):
        """Delete a pool standing"""
        db_service.pool_standings_table.delete_item(
            Key={'standing_id': self.standing_id}
        )
    
    def to_dict(self):
        """Convert pool standing to dictionary"""
        return {
            'standing_id': self.standing_id,
            'pool_id': self.pool_id,
            'tournament_id': self.tournament_id,
            'team_id': self.team_id,
            'wins': self.wins,
            'losses': self.losses,
            'ties': self.ties,
            'sets_won': self.sets_won,
            'sets_lost': self.sets_lost,
            'points_scored': self.points_scored,
            'points_allowed': self.points_allowed,
            'rank': self.rank,
            'created_at': self.created_at
        } 