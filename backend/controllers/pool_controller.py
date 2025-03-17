from flask import Blueprint, request, jsonify
from models.pool import Pool
from models.tournament import Tournament
from models.team import Team
from models.pool_match import PoolMatch
from models.pool_standing import PoolStanding
from models.location import Location
from models.match import Match
from middleware.auth_middleware import require_auth
import logging
import math
import random
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

pool_controller = Blueprint('pool_controller', __name__)

@pool_controller.route('/pools', methods=['POST'])
@require_auth
def create_pool():
    """Create a new pool"""
    try:
        data = request.get_json()
        
        # Validate data
        tournament_id = data.get('tournament_id')
        if not tournament_id:
            return jsonify({'error': 'Tournament ID is required'}), 400
        
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Pool name is required'}), 400
        
        location_id = data.get('location_id')
        court_number = data.get('court_number', 1)
        team_ids = data.get('team_ids', [])
        
        # Create pool
        pool = Pool.create(
            tournament_id=tournament_id,
            name=name,
            location_id=location_id,
            court_number=court_number
        )
        
        # Add teams to pool
        for team_id in team_ids:
            pool.add_team(team_id)
        
        # Initialize standings
        for team_id in team_ids:
            PoolStanding.create(
                pool_id=pool.pool_id,
                tournament_id=tournament_id,
                team_id=team_id,
                wins=0,
                losses=0,
                ties=0,
                sets_won=0,
                sets_lost=0,
                points_scored=0,
                points_allowed=0
            )
        
        return jsonify(pool.to_dict()), 201
    except Exception as e:
        logger.error(f"Error creating pool: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>', methods=['GET'])
def get_pool(pool_id):
    """Get pool details"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
        
        # Get teams in this pool
        teams = []
        if pool.teams:
            for team_id in pool.teams:
                team = Team.get(team_id)
                if team:
                    teams.append(team.to_dict())
        
        # Get standings
        standings = PoolStanding.get_by_pool(pool_id)
        standings_data = [standing.to_dict() for standing in standings]
        
        # Get matches
        matches = PoolMatch.get_by_pool(pool_id)
        matches_data = [match.to_dict() for match in matches]
        
        # Combine all data
        result = pool.to_dict()
        result['teams'] = teams
        result['standings'] = standings_data
        result['matches'] = matches_data
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting pool details: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/teams', methods=['PUT'])
@require_auth
def update_pool_teams(pool_id):
    """Update teams in a pool"""
    try:
        data = request.get_json()
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
        
        team_ids = data.get('team_ids', [])
        if not team_ids:
            return jsonify({'error': 'Team IDs are required'}), 400
        
        # Clear existing teams and add new ones
        pool.teams = []
        pool.update()
        
        for team_id in team_ids:
            pool.add_team(team_id)
        
        # Recreate standings
        # First delete existing standings
        existing_standings = PoolStanding.get_by_pool(pool_id)
        for standing in existing_standings:
            standing.delete()
        
        # Create new standings
        for team_id in team_ids:
            PoolStanding.create(
                pool_id=pool.pool_id,
                tournament_id=pool.tournament_id,
                team_id=team_id,
                wins=0,
                losses=0,
                ties=0,
                sets_won=0,
                sets_lost=0,
                points_scored=0,
                points_allowed=0
            )
        
        return jsonify(pool.to_dict()), 200
    except Exception as e:
        logger.error(f"Error updating pool teams: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/schedule', methods=['POST'])
@require_auth
def generate_schedule(pool_id):
    """Generate a match schedule for a pool"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
        
        # Check if pool has teams
        if not pool.teams or len(pool.teams) < 3:
            return jsonify({'error': 'Pool must have at least 3 teams to generate a schedule'}), 400
        
        # Check if schedule already exists
        existing_matches = PoolMatch.get_by_pool(pool_id)
        if existing_matches:
            # Clear existing matches
            for match in existing_matches:
                match.delete()
        
        # Generate schedule based on number of teams
        team_ids = pool.teams
        tournament = Tournament.get(pool.tournament_id)
        num_teams = len(team_ids)
        
        # Number of sets depends on number of teams
        # 4 teams -> 2 sets
        # 3 teams -> 3 sets
        num_sets = 3 if num_teams == 3 else 2
        
        # Generate all combinations of teams
        matches = []
        for i in range(num_teams):
            for j in range(i + 1, num_teams):
                matches.append((team_ids[i], team_ids[j]))
        
        # Randomize match order
        random.shuffle(matches)
        
        # Create pool matches
        created_matches = []
        start_time = datetime.now() + timedelta(days=1)  # Default to tomorrow
        start_time = start_time.replace(hour=9, minute=0, second=0, microsecond=0)  # Start at 9 AM
        
        for idx, (team1_id, team2_id) in enumerate(matches):
            # Schedule matches 1 hour apart
            match_time = start_time + timedelta(hours=idx)
            
            match = PoolMatch.create(
                pool_id=pool_id,
                tournament_id=pool.tournament_id,
                team1_id=team1_id,
                team2_id=team2_id,
                num_sets=num_sets,
                location_id=pool.location_id,
                court_number=pool.court_number,
                scheduled_time=int(match_time.timestamp())
            )
            created_matches.append(match.to_dict())
        
        return jsonify(created_matches), 201
    except Exception as e:
        logger.error(f"Error generating pool schedule: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/rankings', methods=['GET'])
def get_pool_rankings(pool_id):
    """Get pool rankings"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
        
        # Get standings
        standings = PoolStanding.get_by_pool(pool_id)
        
        # Calculate rankings
        for standing in standings:
            standing.assign_rank()
        
        # Sort by rank
        sorted_standings = sorted(standings, key=lambda s: s.rank if s.rank else 999)
        
        # Convert to dict and add team names
        result = []
        for standing in sorted_standings:
            standing_dict = standing.to_dict()
            team = Team.get(standing.team_id)
            if team:
                standing_dict['team_name'] = team.team_name
            result.append(standing_dict)
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting pool rankings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/tournaments/<tournament_id>/pools', methods=['GET'])
def get_pools_by_tournament(tournament_id):
    """Get all pools for a tournament"""
    try:
        logger.info(f"Getting pools for tournament: {tournament_id}")
        tournament = Tournament.get(tournament_id)
        if not tournament:
            logger.warning(f"Tournament not found: {tournament_id}")
            return jsonify({'error': 'Tournament not found'}), 404
        
        # Get pools for this tournament
        logger.info(f"Fetching pools for tournament: {tournament_id}")
        pools = Pool.get_by_tournament(tournament_id)
        if not pools:
            logger.info(f"No pools found for tournament: {tournament_id}")
            return jsonify([]), 200
        
        # Get detailed info for each pool
        result = []
        for pool in pools:
            try:
                pool_data = pool.to_dict()
                
                # Get teams in this pool
                teams = []
                if pool.teams:
                    for team_id in pool.teams:
                        try:
                            team = Team.get(team_id)
                            if team:
                                teams.append(team.to_dict())
                        except Exception as team_err:
                            logger.error(f"Error getting team {team_id}: {str(team_err)}")
                            # Continue with next team
                
                # Get standings
                standings = []
                try:
                    standings = PoolStanding.get_by_pool(pool.pool_id)
                    standings_data = [standing.to_dict() for standing in standings]
                except Exception as standing_err:
                    logger.error(f"Error getting standings for pool {pool.pool_id}: {str(standing_err)}")
                    standings_data = []
                
                # Add data to pool info
                pool_data['teams'] = teams
                pool_data['standings'] = standings_data
                
                result.append(pool_data)
            except Exception as pool_err:
                logger.error(f"Error processing pool {pool.pool_id}: {str(pool_err)}")
                # Continue with next pool
        
        return jsonify(result), 200
    except Exception as e:
        import traceback
        stack_trace = traceback.format_exc()
        logger.error(f"Error getting pools for tournament: {str(e)}\n{stack_trace}")
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching pools'
        }), 500

@pool_controller.route('/tournaments/<tournament_id>/pools', methods=['POST'])
@require_auth
def create_pools_for_tournament(tournament_id):
    """Auto-generate pools for a tournament"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
        
        # Get teams in tournament
        teams = Team.get_by_tournament(tournament_id)
        if not teams:
            return jsonify({'error': 'No teams found in tournament'}), 400
        
        # Get available locations
        locations = Location.get_all()
        if not locations:
            return jsonify({'error': 'No locations available. Please add locations first.'}), 400
        
        # Calculate number of pools needed (aim for 4 teams per pool)
        num_teams = len(teams)
        num_pools = math.ceil(num_teams / 4)
        
        # If there are not enough courts across all locations, return error
        total_courts = sum(location.courts for location in locations)
        if total_courts < num_pools:
            return jsonify({'error': f'Not enough courts available. Need {num_pools} courts but only have {total_courts}'}), 400
        
        # Delete existing pools
        existing_pools = Pool.get_by_tournament(tournament_id)
        for pool in existing_pools:
            # Delete matches in pool
            pool_matches = PoolMatch.get_by_pool(pool.pool_id)
            for match in pool_matches:
                match.delete()
            
            # Delete standings
            standings = PoolStanding.get_by_pool(pool.pool_id)
            for standing in standings:
                standing.delete()
            
            # Delete pool
            pool.delete()
        
        # Create pools and assign teams evenly
        # Sort locations by number of courts (descending)
        locations.sort(key=lambda loc: loc.courts, reverse=True)
        
        pool_names = [chr(65 + i) for i in range(num_pools)]  # A, B, C, etc.
        team_assignments = [[] for _ in range(num_pools)]
        
        # Shuffle teams for random assignment
        random.shuffle(teams)
        
        # Assign teams to pools
        for i, team in enumerate(teams):
            pool_idx = i % num_pools
            team_assignments[pool_idx].append(team.team_id)
        
        created_pools = []
        court_assignments = []  # List of (location_id, court_number) tuples
        
        # Create court assignments from available locations
        for location in locations:
            for court in range(1, location.courts + 1):
                court_assignments.append((location.location_id, court))
                if len(court_assignments) >= num_pools:
                    break
            if len(court_assignments) >= num_pools:
                break
        
        # Create pools
        for i in range(num_pools):
            pool_name = f"Pool {pool_names[i]}"
            location_id, court_number = court_assignments[i]
            
            pool = Pool.create(
                tournament_id=tournament_id,
                name=pool_name,
                location_id=location_id,
                court_number=court_number
            )
            
            # Add teams to pool
            for team_id in team_assignments[i]:
                pool.add_team(team_id)
            
            # Initialize standings
            for team_id in team_assignments[i]:
                PoolStanding.create(
                    pool_id=pool.pool_id,
                    tournament_id=tournament_id,
                    team_id=team_id,
                    wins=0,
                    losses=0,
                    ties=0,
                    sets_won=0,
                    sets_lost=0,
                    points_scored=0,
                    points_allowed=0
                )
            
            created_pools.append(pool.to_dict())
        
        # Update tournament to have pool play
        tournament.has_pool_play = True
        tournament.num_pools = num_pools
        tournament.teams_per_pool = 4  # Default, may have some pools with 3
        tournament.pool_play_complete = False
        tournament.update()
        
        return jsonify(created_pools), 201
    except Exception as e:
        logger.error(f"Error creating pools: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/tournaments/<tournament_id>/complete-pool-play', methods=['POST'])
@require_auth
def complete_pool_play(tournament_id):
    """Complete pool play and prepare for bracket play"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
        
        # Update tournament status
        tournament.status = 'bracket_play'
        tournament.pool_play_complete = True
        tournament.update()
        
        # Get all pools
        pools = Pool.get_by_tournament(tournament_id)
        
        # Ensure all pool matches are completed
        all_matches_complete = True
        for pool in pools:
            matches = PoolMatch.get_by_pool(pool.pool_id)
            for match in matches:
                if match.status != 'completed':
                    all_matches_complete = False
                    break
            if not all_matches_complete:
                break
        
        if not all_matches_complete:
            # Update rankings based on current results
            for pool in pools:
                standings = PoolStanding.get_by_pool(pool.pool_id)
                for standing in standings:
                    standing.assign_rank()
        
        return jsonify({
            'message': 'Pool play completed',
            'all_matches_completed': all_matches_complete
        }), 200
    except Exception as e:
        logger.error(f"Error completing pool play: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/tournaments/<tournament_id>/create-bracket-from-pools', methods=['POST'])
@require_auth
def create_bracket_from_pools(tournament_id):
    """Create brackets based on pool rankings"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
        
        # Get all pools
        pools = Pool.get_by_tournament(tournament_id)
        if not pools:
            return jsonify({'error': 'No pools found for tournament'}), 400
        
        # Get rankings from each pool
        pool_rankings = []
        for pool in pools:
            standings = PoolStanding.get_by_pool(pool.pool_id)
            # Calculate rankings if not already done
            for standing in standings:
                standing.assign_rank()
            
            # Sort by rank, then win percentage, then point differential
            sorted_standings = sorted(
                standings,
                key=lambda s: (
                    s.rank if s.rank else 999,
                    -s.get_win_percentage(),
                    -s.get_points_differential()
                )
            )
            
            pool_rankings.append({
                'pool_id': pool.pool_id,
                'pool_name': pool.name,
                'rankings': [(s.team_id, s.rank) for s in sorted_standings]
            })
        
        # Determine bracket size (4, 8, or 12)
        total_teams = sum(len(p['rankings']) for p in pool_rankings)
        
        if total_teams <= 6:
            bracket_size = 4
        elif total_teams <= 10:
            bracket_size = 8
        else:
            bracket_size = 12
        
        # Update tournament with bracket size
        tournament.bracket_size = bracket_size
        tournament.update()
        
        # Create brackets based on pool rankings
        # Each location gets one bracket type (Gold, Silver, Bronze)
        bracket_types = ['Gold', 'Silver', 'Bronze', 'Diamond']
        
        # Get available locations for brackets
        locations = Location.get_all()
        if not locations:
            return jsonify({'error': 'No locations available for brackets'}), 400
        
        # Calculate how many brackets we'll need
        num_brackets = math.ceil(total_teams / bracket_size)
        if num_brackets > len(locations):
            return jsonify({'error': f'Not enough locations for brackets. Need {num_brackets} but only have {len(locations)}'}), 400
        
        # Create bracket mapping
        # 1st place teams go to Gold, 2nd to Silver, etc.
        seeding = []
        
        # Get all 1st place teams first, then 2nd place, etc.
        for rank in range(1, 5):  # 1-4 rankings
            for pool in pool_rankings:
                for team_id, team_rank in pool['rankings']:
                    if team_rank == rank:
                        seeding.append({
                            'team_id': team_id,
                            'rank': rank,
                            'original_pool': pool['pool_name']
                        })
        
        # Create bracket matches
        bracket_matches = []
        
        if bracket_size == 4:
            # Single 4-team bracket
            if len(seeding) < 4:
                return jsonify({'error': 'Not enough teams for a 4-team bracket'}), 400
            
            # Semi-finals: 1 vs 4, 2 vs 3
            semi1 = Match.create(
                tournament_id=tournament_id,
                team1_id=seeding[0]['team_id'],
                team2_id=seeding[3]['team_id'],
                round_number=1,
                match_number=1,
                bracket='Gold',
                location_id=locations[0].location_id,
                num_sets=3  # Best 2 of 3 for bracket play
            )
            
            semi2 = Match.create(
                tournament_id=tournament_id,
                team1_id=seeding[1]['team_id'],
                team2_id=seeding[2]['team_id'],
                round_number=1,
                match_number=2,
                bracket='Gold',
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            # Finals (winners of semis)
            final = Match.create(
                tournament_id=tournament_id,
                team1_id=None,  # Will be filled after semis
                team2_id=None,
                round_number=2,
                match_number=1,
                bracket='Gold',
                prev_match1_id=semi1.match_id,
                prev_match2_id=semi2.match_id,
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            bracket_matches.extend([semi1, semi2, final])
        
        elif bracket_size == 8:
            # Single 8-team bracket
            if len(seeding) < 8:
                return jsonify({'error': 'Not enough teams for an 8-team bracket'}), 400
            
            # Quarterfinals: 1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7
            quarters = []
            matchups = [(0, 7), (3, 4), (2, 5), (1, 6)]
            
            for i, (idx1, idx2) in enumerate(matchups):
                match = Match.create(
                    tournament_id=tournament_id,
                    team1_id=seeding[idx1]['team_id'],
                    team2_id=seeding[idx2]['team_id'],
                    round_number=1,
                    match_number=i+1,
                    bracket='Gold',
                    location_id=locations[0].location_id,
                    num_sets=3
                )
                quarters.append(match)
            
            # Semifinals
            semi1 = Match.create(
                tournament_id=tournament_id,
                team1_id=None,
                team2_id=None,
                round_number=2,
                match_number=1,
                bracket='Gold',
                prev_match1_id=quarters[0].match_id,
                prev_match2_id=quarters[1].match_id,
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            semi2 = Match.create(
                tournament_id=tournament_id,
                team1_id=None,
                team2_id=None,
                round_number=2,
                match_number=2,
                bracket='Gold',
                prev_match1_id=quarters[2].match_id,
                prev_match2_id=quarters[3].match_id,
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            # Finals
            final = Match.create(
                tournament_id=tournament_id,
                team1_id=None,
                team2_id=None,
                round_number=3,
                match_number=1,
                bracket='Gold',
                prev_match1_id=semi1.match_id,
                prev_match2_id=semi2.match_id,
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            bracket_matches.extend(quarters + [semi1, semi2, final])
        
        elif bracket_size == 12:
            # Two brackets: Gold (8 teams) and Silver (4 teams)
            if len(seeding) < 8:
                return jsonify({'error': 'Not enough teams for Gold bracket'}), 400
            
            # Gold bracket - top 8 teams
            # Quarterfinals: 1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7
            gold_quarters = []
            matchups = [(0, 7), (3, 4), (2, 5), (1, 6)]
            
            for i, (idx1, idx2) in enumerate(matchups):
                match = Match.create(
                    tournament_id=tournament_id,
                    team1_id=seeding[idx1]['team_id'],
                    team2_id=seeding[idx2]['team_id'],
                    round_number=1,
                    match_number=i+1,
                    bracket='Gold',
                    location_id=locations[0].location_id,
                    num_sets=3
                )
                gold_quarters.append(match)
            
            # Gold semifinals
            gold_semi1 = Match.create(
                tournament_id=tournament_id,
                team1_id=None,
                team2_id=None,
                round_number=2,
                match_number=1,
                bracket='Gold',
                prev_match1_id=gold_quarters[0].match_id,
                prev_match2_id=gold_quarters[1].match_id,
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            gold_semi2 = Match.create(
                tournament_id=tournament_id,
                team1_id=None,
                team2_id=None,
                round_number=2,
                match_number=2,
                bracket='Gold',
                prev_match1_id=gold_quarters[2].match_id,
                prev_match2_id=gold_quarters[3].match_id,
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            # Gold finals
            gold_final = Match.create(
                tournament_id=tournament_id,
                team1_id=None,
                team2_id=None,
                round_number=3,
                match_number=1,
                bracket='Gold',
                prev_match1_id=gold_semi1.match_id,
                prev_match2_id=gold_semi2.match_id,
                location_id=locations[0].location_id,
                num_sets=3
            )
            
            bracket_matches.extend(gold_quarters + [gold_semi1, gold_semi2, gold_final])
            
            # Silver bracket - teams 9-12 if available
            if len(seeding) >= 12:
                silver_teams = seeding[8:12]
                
                # Silver semifinals: 9 vs 12, 10 vs 11
                silver_semi1 = Match.create(
                    tournament_id=tournament_id,
                    team1_id=silver_teams[0]['team_id'],
                    team2_id=silver_teams[3]['team_id'],
                    round_number=1,
                    match_number=1,
                    bracket='Silver',
                    location_id=locations[1].location_id,
                    num_sets=3
                )
                
                silver_semi2 = Match.create(
                    tournament_id=tournament_id,
                    team1_id=silver_teams[1]['team_id'],
                    team2_id=silver_teams[2]['team_id'],
                    round_number=1,
                    match_number=2,
                    bracket='Silver',
                    location_id=locations[1].location_id,
                    num_sets=3
                )
                
                # Silver finals
                silver_final = Match.create(
                    tournament_id=tournament_id,
                    team1_id=None,
                    team2_id=None,
                    round_number=2,
                    match_number=1,
                    bracket='Silver',
                    prev_match1_id=silver_semi1.match_id,
                    prev_match2_id=silver_semi2.match_id,
                    location_id=locations[1].location_id,
                    num_sets=3
                )
                
                bracket_matches.extend([silver_semi1, silver_semi2, silver_final])
        
        # Return created bracket matches
        return jsonify([match.to_dict() for match in bracket_matches]), 201
    except Exception as e:
        logger.error(f"Error creating brackets: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pool-matches/<match_id>', methods=['GET'])
def get_pool_match(match_id):
    """Get details of a pool match"""
    try:
        match = PoolMatch.get(match_id)
        if not match:
            return jsonify({'error': 'Match not found'}), 404
        
        result = match.to_dict()
        
        # Add team names
        team1 = Team.get(match.team1_id)
        team2 = Team.get(match.team2_id)
        
        if team1:
            result['team1_name'] = team1.team_name
        
        if team2:
            result['team2_name'] = team2.team_name
        
        # Add pool name
        pool = Pool.get(match.pool_id)
        if pool:
            result['pool_name'] = pool.name
        
        # Add location name
        if match.location_id:
            location = Location.get(match.location_id)
            if location:
                result['location_name'] = location.name
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting pool match: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/matches', methods=['GET'])
def get_pool_matches(pool_id):
    """Get all matches in a pool"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
        
        matches = PoolMatch.get_by_pool(pool_id)
        
        result = []
        for match in matches:
            match_dict = match.to_dict()
            
            # Add team names
            team1 = Team.get(match.team1_id)
            team2 = Team.get(match.team2_id)
            
            if team1:
                match_dict['team1_name'] = team1.team_name
            
            if team2:
                match_dict['team2_name'] = team2.team_name
            
            result.append(match_dict)
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting pool matches: {str(e)}")
        return jsonify({'error': str(e)}), 500 