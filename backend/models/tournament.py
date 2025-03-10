import uuid
import time
from services.db_service import db_service
from models.match import Match

class Tournament:
    def __init__(self, tournament_id=None, name=None, start_date=None, end_date=None,
                 location=None, status='upcoming', type='single_elimination'):
        self.tournament_id = tournament_id or str(uuid.uuid4())
        self.name = name
        self.start_date = start_date or int(time.time())
        self.end_date = end_date
        self.location = location
        self.status = status  # 'upcoming', 'in_progress', 'completed'
        self.type = type  # 'single_elimination', 'double_elimination', 'round_robin'
    
    @classmethod
    def create(cls, name, start_date=None, end_date=None, location=None, type='single_elimination'):
        tournament = cls(
            name=name,
            start_date=start_date,
            end_date=end_date,
            location=location,
            type=type
        )
        
        # Save to DynamoDB
        db_service.tournaments_table.put_item(Item=tournament.to_dict())
        return tournament
    
    @classmethod
    def get(cls, tournament_id):
        response = db_service.tournaments_table.get_item(Key={'tournament_id': tournament_id})
        if 'Item' in response:
            return cls(**response['Item'])
        return None
    
    @classmethod
    def get_all(cls):
        response = db_service.tournaments_table.scan()
        return [cls(**item) for item in response.get('Items', [])]
    
    def update(self):
        db_service.tournaments_table.put_item(Item=self.to_dict())
        return self
    
    def delete(self):
        # This would also need to clean up related matches and teams
        db_service.tournaments_table.delete_item(Key={'tournament_id': self.tournament_id})
    
    def create_bracket(self, team_ids):
        """
        Create a bracket for the tournament based on the list of team IDs
        For simplicity, this example implements only single elimination
        """
        if self.type != 'single_elimination':
            raise NotImplementedError(f"Tournament type {self.type} not implemented yet")
        
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
            round_number=num_rounds
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
                        round_number=r
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
        
        # Set tournament to in_progress
        self.status = 'in_progress'
        self.update()
        
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
    
    def to_dict(self):
        return {
            'tournament_id': self.tournament_id,
            'name': self.name,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'location': self.location,
            'status': self.status,
            'type': self.type
        }
