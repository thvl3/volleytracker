from flask import Blueprint, request, jsonify
from models.pool import Pool
from models.pool_match import PoolMatch
from models.pool_standing import PoolStanding
from models.tournament import Tournament
from models.team import Team
from middleware.auth_middleware import require_auth
import logging
import random
import time

logger = logging.getLogger(__name__)

pool_controller = Blueprint('pool_controller', __name__)

@pool_controller.route('/tournaments/<tournament_id>/pools', methods=['POST'])
@require_auth
def create_pools_for_tournament(tournament_id):
    """Create pools for a tournament and distribute teams evenly"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
            
        if not tournament.has_pool_play:
            return jsonify({'error': 'This tournament does not support pool play'}), 400
            
        teams = Team.get_all(tournament_id)
        if not teams:
            return jsonify({'error': 'No teams found for this tournament'}), 400
            
        team_ids = [team.team_id for team in teams]
        
        # Check minimum and maximum team requirements
        if len(team_ids) < tournament.min_teams:
            return jsonify({
                'error': f'Tournament requires at least {tournament.min_teams} teams, but only {len(team_ids)} were found'
            }), 400
            
        if len(team_ids) > tournament.max_teams:
            return jsonify({
                'error': f'Tournament cannot have more than {tournament.max_teams} teams, but {len(team_ids)} were found'
            }), 400
            
        # Create pools and distribute teams
        pools = tournament.create_pools(team_ids)
        
        return jsonify({
            'message': f'Created {len(pools)} pools for tournament',
            'pools': [pool.to_dict() for pool in pools]
        }), 201
    except Exception as e:
        logger.error(f"Error creating pools: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/tournaments/<tournament_id>/pools', methods=['GET'])
def get_tournament_pools(tournament_id):
    """Get all pools for a tournament"""
    try:
        pools = Pool.get_by_tournament(tournament_id)
        return jsonify([pool.to_dict() for pool in pools]), 200
    except Exception as e:
        logger.error(f"Error getting pools: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>', methods=['GET'])
def get_pool(pool_id):
    """Get a pool by ID with teams and standings"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
            
        # Get team details
        teams = []
        for team_id in pool.teams:
            team = Team.get(team_id)
            if team:
                teams.append(team.to_dict())
        
        # Get standings
        standings = PoolStanding.get_by_pool(pool_id)
        standings_data = [standing.to_dict() for standing in standings]
        
        # Sort standings by rank
        standings_data.sort(key=lambda x: x.get('rank', 999))
        
        result = pool.to_dict()
        result['teams'] = teams
        result['standings'] = standings_data
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting pool: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/teams', methods=['PUT'])
@require_auth
def update_pool_teams(pool_id):
    """Update teams in a pool"""
    try:
        data = request.get_json()
        team_ids = data.get('team_ids', [])
        
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
            
        # Verify all teams exist
        for team_id in team_ids:
            team = Team.get(team_id)
            if not team:
                return jsonify({'error': f'Team {team_id} not found'}), 400
                
        # Update the pool's teams
        pool.teams = team_ids
        pool.update()
        
        # Create or update standings for each team
        for team_id in team_ids:
            standing = PoolStanding.get_by_team_and_pool(team_id, pool_id)
            if not standing:
                PoolStanding.create(
                    pool_id=pool_id,
                    tournament_id=pool.tournament_id,
                    team_id=team_id
                )
        
        return jsonify(pool.to_dict()), 200
    except Exception as e:
        logger.error(f"Error updating pool teams: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/schedule', methods=['POST'])
@require_auth
def generate_pool_schedule(pool_id):
    """Generate a round-robin schedule for teams in a pool"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
            
        tournament = Tournament.get(pool.tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
            
        if len(pool.teams) < 2:
            return jsonify({'error': 'Pool must have at least 2 teams to generate a schedule'}), 400
            
        # Get current time as base for scheduling
        current_time = int(time.time())
        
        # Create all possible team pairings
        teams = pool.teams.copy()
        matches = []
        
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                # Create a pool match between the two teams
                match = PoolMatch.create(
                    tournament_id=tournament.tournament_id,
                    pool_id=pool.pool_id,
                    team1_id=teams[i],
                    team2_id=teams[j],
                    num_sets=tournament.pool_sets,
                    is_pool_match=True,
                    scheduled_time=current_time,
                    location_id=pool.location_id,
                    court_number=pool.court_number
                )
                matches.append(match)
                
                # Add 30 minutes for the next match
                current_time += 30 * 60
        
        return jsonify({
            'message': f'Generated {len(matches)} matches for pool',
            'matches': [match.to_dict() for match in matches]
        }), 201
    except Exception as e:
        logger.error(f"Error generating pool schedule: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/matches', methods=['GET'])
def get_pool_matches(pool_id):
    """Get all matches for a pool"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
            
        matches = PoolMatch.get_by_pool(pool_id)
        
        return jsonify([match.to_dict() for match in matches]), 200
    except Exception as e:
        logger.error(f"Error getting pool matches: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/tournaments/<tournament_id>/complete-pool-play', methods=['POST'])
@require_auth
def complete_pool_play(tournament_id):
    """Mark pool play as complete and prepare for bracket play"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
            
        if not tournament.has_pool_play:
            return jsonify({'error': 'This tournament does not have pool play'}), 400
            
        # Check if all pool matches are completed
        pools = Pool.get_by_tournament(tournament_id)
        for pool in pools:
            matches = PoolMatch.get_by_pool(pool.pool_id)
            incomplete_matches = [m for m in matches if m.status != 'completed']
            
            if incomplete_matches:
                return jsonify({
                    'error': f'Pool {pool.name} has {len(incomplete_matches)} incomplete matches',
                    'incomplete_matches': [m.to_dict() for m in incomplete_matches]
                }), 400
        
        # Mark pool play as complete
        tournament.complete_pool_play()
        
        return jsonify({
            'message': 'Pool play completed',
            'tournament': tournament.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Error completing pool play: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/tournaments/<tournament_id>/rankings', methods=['GET'])
def get_tournament_rankings(tournament_id):
    """Get team rankings across all pools in a tournament"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
            
        if not tournament.has_pool_play:
            return jsonify({'error': 'This tournament does not have pool play'}), 400
            
        pools = Pool.get_by_tournament(tournament_id)
        
        # Collect all standings
        all_standings = []
        for pool in pools:
            standings = PoolStanding.get_by_pool(pool.pool_id)
            
            # Get team names for the standings
            for standing in standings:
                team = Team.get(standing.team_id)
                if team:
                    standing_dict = standing.to_dict()
                    standing_dict['team_name'] = team.team_name
                    standing_dict['pool_name'] = pool.name
                    all_standings.append(standing_dict)
        
        # Sort by win percentage, then points differential
        all_standings.sort(key=lambda x: (
            -x.get('win_percentage', 0),  # Higher win % first
            -x.get('points_differential', 0),  # Higher points differential first
            x.get('pool_name', '')  # Alphabetical by pool name
        ))
        
        return jsonify(all_standings), 200
    except Exception as e:
        logger.error(f"Error getting tournament rankings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/rankings', methods=['GET'])
def get_pool_rankings(pool_id):
    """Get team rankings for a specific pool"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
            
        # Get standings and sort by rank
        standings = PoolStanding.get_by_pool(pool_id)
        
        # Add team names
        result = []
        for standing in standings:
            team = Team.get(standing.team_id)
            if team:
                standing_dict = standing.to_dict()
                standing_dict['team_name'] = team.team_name
                result.append(standing_dict)
        
        # Sort by rank
        result.sort(key=lambda x: x.get('rank', 999))
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting pool rankings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_controller.route('/pools/<pool_id>/initialize-standings', methods=['POST'])
def initialize_pool_standings(pool_id):
    """Initialize standings for all teams in a pool"""
    try:
        pool = Pool.get(pool_id)
        if not pool:
            return jsonify({'error': 'Pool not found'}), 404
            
        # Create standings for each team in the pool
        created_standings = []
        for team_id in pool.teams:
            # Check if standings already exist
            existing = PoolStanding.get_by_team_and_pool(team_id, pool_id)
            if not existing:
                # Create new standings
                standing = PoolStanding.create(
                    pool_id=pool_id,
                    tournament_id=pool.tournament_id,
                    team_id=team_id
                )
                created_standings.append(standing.to_dict())
            else:
                created_standings.append(existing.to_dict())
                
        return jsonify({
            'message': f'Created {len(created_standings)} standings',
            'standings': created_standings
        }), 200
    except Exception as e:
        logger.error(f"Error initializing pool standings: {str(e)}")
        return jsonify({'error': str(e)}), 500 