import uuid
import time
from services.db_service import db_service
from models.match import Match
from boto3.dynamodb.conditions import Attr

class Tournament:
    def __init__(self, tournament_id=None, name=None, start_date=None, end_date=None,
                 location=None, status='upcoming', type='single_elimination', 
                 location_id=None, min_teams=8, max_teams=32, 
                 has_pool_play=False, pool_play_complete=False,
                 num_pools=0, teams_per_pool=4, pool_sets=2,
                 bracket_size=None, bracket_sets=3):
        self.tournament_id = tournament_id or str(uuid.uuid4())
        self.name = name
        self.start_date = start_date or int(time.time())
        self.end_date = end_date
        self.location = location  # Legacy field
        self.location_id = location_id  # New field referencing the Location model
        self.status = status  # 'upcoming', 'in_progress', 'pool_play', 'bracket_play', 'completed'
        self.type = type  # 'single_elimination', 'double_elimination', 'round_robin'
        self.min_teams = min_teams  # Minimum number of teams (8)
        self.max_teams = max_teams  # Maximum number of teams (32)
        self.has_pool_play = has_pool_play  # Whether the tournament includes pool play
        self.pool_play_complete = pool_play_complete  # Whether pool play is completed
        self.num_pools = num_pools  # Number of pools (calculated based on team count)
        self.teams_per_pool = teams_per_pool  # Teams per pool (default 4)
        self.pool_sets = pool_sets  # Number of sets in pool play matches (default 2)
        self.bracket_size = bracket_size  # Size of the bracket (4, 8, or 12 teams)
        self.bracket_sets = bracket_sets  # Number of sets in bracket matches (default best 2 of 3)
    
    @classmethod
    def create(cls, tournament):
        """Create a new tournament"""
        tournament_id = str(uuid.uuid4())
        tournament.tournament_id = tournament_id
        
        # Create item with tournament_id as the primary key
        item = tournament.to_dict()
        
        db_service.tournaments_table.put_item(Item=item)
        return tournament

    @classmethod
    def get(cls, tournament_id):
        """Get a tournament by ID"""
        response = db_service.tournaments_table.get_item(
            Key={
                'tournament_id': tournament_id
            }
        )
        
        item = response.get('Item')
        if not item:
            return None
        
        return cls(**item)

    @classmethod
    def get_all(cls):
        """Get all tournaments"""
        response = db_service.tournaments_table.scan()
        
        tournaments = []
        for item in response.get('Items', []):
            tournaments.append(cls(**item))
            
        return tournaments

    @classmethod
    def update(cls, tournament):
        """Update a tournament"""
        item = tournament.to_dict()
        
        db_service.tournaments_table.put_item(Item=item)
        return tournament
    
    def delete(self):
        """Delete a tournament and optionally clean up related data"""
        db_service.tournaments_table.delete_item(
            Key={'tournament_id': self.tournament_id}
        )
        # Note: In a real application, you'd want to handle deletion of related 
        # teams and matches here as well, or implement a cascading delete function
    
    def create_pools(self, team_ids):
        """
        Create pools for the tournament based on the list of team IDs
        This is used for the initial pool play phase
        """
        if not self.has_pool_play:
            raise ValueError("This tournament does not have pool play enabled")
        
        from models.pool import Pool
        
        # Calculate number of pools needed based on team count
        num_teams = len(team_ids)
        if num_teams < self.min_teams:
            raise ValueError(f"Tournament requires at least {self.min_teams} teams")
        if num_teams > self.max_teams:
            raise ValueError(f"Tournament cannot have more than {self.max_teams} teams")
        
        # Calculate number of pools
        if self.teams_per_pool <= 0:
            raise ValueError("Teams per pool must be greater than 0")
        
        num_pools = (num_teams + self.teams_per_pool - 1) // self.teams_per_pool
        self.num_pools = num_pools
        
        # Update tournament status
        self.status = 'pool_play'
        self.update()
        
        # Create pools and assign teams
        pools = []
        for i in range(num_pools):
            pool_name = f"Pool {chr(65 + i)}"  # Pool A, Pool B, etc.
            pool = Pool.create(
                tournament_id=self.tournament_id,
                name=pool_name,
                location_id=self.location_id
            )
            pools.append(pool)
        
        # Distribute teams evenly across pools
        for i, team_id in enumerate(team_ids):
            pool_index = i % num_pools
            pools[pool_index].add_team(team_id)
        
        return pools
        
    def create_bracket(self, team_ids):
        """
        Create a bracket for the tournament based on the list of team IDs
        For simplicity, this example implements only single elimination
        """
        if self.type != 'single_elimination':
            raise NotImplementedError(f"Tournament type {self.type} not implemented yet")
        
        # Validate bracket size
        if self.bracket_size and len(team_ids) != self.bracket_size:
            raise ValueError(f"Expected {self.bracket_size} teams for bracket, got {len(team_ids)}")
        
        # Ensure even number of teams by adding a "bye"
        if len(team_ids) % 2 != 0:
            team_ids.append(None)  # Bye team
        
        # Calculate number of rounds needed
        num_teams = len(team_ids)
        num_rounds = 0
        while (1 << num_rounds) < num_teams:
            num_rounds += 1
        
        # Create matches for each round
        matches_by_round = {}
        
        # Create final match first
        final_match = Match.create(
            tournament_id=self.tournament_id,
            round_number=num_rounds,
            location_id=self.location_id
        )
        matches_by_round[num_rounds] = [final_match]
        
        # Create earlier rounds (working backwards)
        for r in range(num_rounds - 1, 0, -1):
            matches_by_round[r] = []
            for parent_match in matches_by_round[r + 1]:
                # Create two child matches that feed into this parent
                for _ in range(2):
                    child_match = Match.create(
                        tournament_id=self.tournament_id,
                        next_match_id=parent_match.match_id,
                        round_number=r,
                        location_id=self.location_id
                    )
                    matches_by_round[r].append(child_match)
        
        # Assign teams to first round matches
        for i, match in enumerate(matches_by_round[1]):
            match.team1_id = team_ids[i * 2] if i * 2 < len(team_ids) else None
            match.team2_id = team_ids[i * 2 + 1] if i * 2 + 1 < len(team_ids) else None
            
            # If a team gets a bye, automatically advance them
            if match.team1_id and match.team2_id is None:
                match.status = 'completed'
                match.score_team1 = 1
                match.score_team2 = 0
                
                # Advance the team to the next match
                next_match = Match.get(match.next_match_id)
                if not next_match.team1_id:
                    next_match.team1_id = match.team1_id
                else:
                    next_match.team2_id = match.team1_id
                next_match.update()
            elif match.team1_id is None and match.team2_id:
                match.status = 'completed'
                match.score_team1 = 0
                match.score_team2 = 1
                
                # Advance the team to the next match
                next_match = Match.get(match.next_match_id)
                if not next_match.team1_id:
                    next_match.team1_id = match.team2_id
                else:
                    next_match.team2_id = match.team2_id
                next_match.update()
            
            match.update()
        
        # Update tournament status
        self.status = 'bracket_play'
        Tournament.update(self)
        
        # Return all matches by round
        all_matches = []
        for round_matches in matches_by_round.values():
            all_matches.extend(round_matches)
        
        return all_matches
    
    def get_bracket(self):
        """Get all matches for this tournament grouped by round"""
        matches = Match.get_by_tournament_status(self.tournament_id)
        
        # Group by round
        rounds = {}
        for match in matches:
            if match.round_number not in rounds:
                rounds[match.round_number] = []
            rounds[match.round_number].append(match.to_dict())
        
        # Sort rounds
        result = []
        for round_number in sorted(rounds.keys()):
            result.append({
                'round': round_number,
                'matches': rounds[round_number]
            })
        
        return result
    
    def complete_pool_play(self):
        """Mark pool play as complete and prepare for bracket play"""
        if not self.has_pool_play:
            raise ValueError("This tournament does not have pool play")
            
        self.pool_play_complete = True
        self.update()
        
        return self
    
    def complete_tournament(self):
        """Mark the tournament as completed"""
        self.status = 'completed'
        self.update()
        
        return self
    
    def to_dict(self):
        """Convert tournament to dictionary"""
        return {
            'tournament_id': self.tournament_id,
            'name': self.name,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'location': self.location,
            'location_id': self.location_id,
            'status': self.status,
            'type': self.type,
            'min_teams': self.min_teams,
            'max_teams': self.max_teams,
            'has_pool_play': self.has_pool_play,
            'pool_play_complete': self.pool_play_complete,
            'num_pools': self.num_pools,
            'teams_per_pool': self.teams_per_pool,
            'pool_sets': self.pool_sets,
            'bracket_size': self.bracket_size,
            'bracket_sets': self.bracket_sets
        }
