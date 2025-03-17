from models.match import Match
from models.team import Team

class BracketService:
    """
    Service for creating and managing tournament brackets
    """
    
    @staticmethod
    def create_single_elimination_bracket(tournament_id, team_ids):
        """
        Create a single elimination bracket for the given tournament and teams
        Returns a list of matches organized by rounds
        """
        if not team_ids or len(team_ids) < 2:
            raise ValueError("At least 2 teams are required to create a bracket")
            
        # Calculate number of rounds needed
        import math
        num_teams = len(team_ids)
        num_rounds = math.ceil(math.log2(num_teams))
        
        # Calculate number of matches in first round
        matches_in_first_round = 2 ** num_rounds - num_teams
        byes = 2 ** num_rounds - num_teams
        
        # Create matches structure
        rounds = []
        matches_by_round = {}
        
        # Create all rounds
        for round_num in range(1, num_rounds + 1):
            matches_in_round = 2 ** (num_rounds - round_num)
            matches_by_round[round_num] = []
            
            # For each match in this round
            for i in range(matches_in_round):
                # Create match
                match = Match.create(
                    tournament_id=tournament_id,
                    round_number=round_num
                )
                
                matches_by_round[round_num].append(match)
                
                # If not the last round, set this match as the parent for 2 matches in the previous round
                if round_num < num_rounds:
                    next_round_index = i * 2
                    # Set next_match_id for the child matches that will feed into this match
                    if next_round_index < len(matches_by_round.get(round_num + 1, [])):
                        matches_by_round[round_num + 1][next_round_index].next_match_id = match.match_id
                        matches_by_round[round_num + 1][next_round_index].update()
                    
                    if next_round_index + 1 < len(matches_by_round.get(round_num + 1, [])):
                        matches_by_round[round_num + 1][next_round_index + 1].next_match_id = match.match_id
                        matches_by_round[round_num + 1][next_round_index + 1].update()
        
        # Assign teams to first round matches
        first_round = matches_by_round[num_rounds]
        for i, match in enumerate(first_round):
            # First team
            if i * 2 < num_teams:
                match.team1_id = team_ids[i * 2]
            
            # Second team
            if i * 2 + 1 < num_teams:
                match.team2_id = team_ids[i * 2 + 1]
                
            # Update match
            match.update()
        
        # Format the result for API response
        for round_num in range(1, num_rounds + 1):
            rounds.append({
                'round': round_num,
                'matches': [match.to_dict() for match in matches_by_round[round_num]]
            })
        
        return rounds 