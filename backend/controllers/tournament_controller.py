from flask import Blueprint, request, jsonify
from models.tournament import Tournament
from models.match import Match
from models.team import Team
from models.match_update import MatchUpdate
from services.auth_service import AuthService
from services.bracket_service import BracketService
from functools import wraps

tournament_bp = Blueprint('tournament', __name__)

# Auth middleware
def require_auth(f):
    @wraps(f)  # Add this wraps decorator
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = AuthService.validate_token(token)
        
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@tournament_bp.route('/', methods=['GET'])
def get_tournaments():
    """Get all tournaments"""
    tournaments = Tournament.get_all()
    return jsonify([tournament.to_dict() for tournament in tournaments]), 200

@tournament_bp.route('/<tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    """Get a specific tournament by ID"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
            
        # Get tournament details as dict
        result = tournament.to_dict()
        
        # Add teams
        teams = Team.get_all(tournament_id)
        result['teams'] = [team.to_dict() for team in teams]
        
        # Add bracket if it exists
        if tournament.status in ['in_progress', 'bracket_play', 'completed']:
            result['bracket'] = tournament.get_bracket()
            
        # Add pools if this tournament has pool play
        if tournament.has_pool_play:
            from models.pool import Pool
            pools = Pool.get_by_tournament(tournament_id)
            
            pools_data = []
            for pool in pools:
                pool_dict = pool.to_dict()
                
                # Get team names for each pool
                pool_teams = []
                for team_id in pool.teams:
                    team = Team.get(team_id)
                    if team:
                        pool_teams.append(team.to_dict())
                
                pool_dict['teams'] = pool_teams
                
                # Get pool standings
                from models.pool_standing import PoolStanding
                standings = PoolStanding.get_by_pool(pool.pool_id)
                standings_data = [standing.to_dict() for standing in standings]
                
                # Sort standings by rank
                standings_data.sort(key=lambda x: x.get('rank', 999))
                pool_dict['standings'] = standings_data
                
                # Get pool matches
                from models.pool_match import PoolMatch
                matches = PoolMatch.get_by_pool(pool.pool_id)
                pool_dict['matches'] = [match.to_dict() for match in matches]
                
                pools_data.append(pool_dict)
                
            result['pools'] = pools_data
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tournament_bp.route('/<tournament_id>/bracket', methods=['GET'])
def get_tournament_bracket(tournament_id):
    """Get the bracket for a tournament"""
    tournament = Tournament.get(tournament_id)
    
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    bracket = tournament.get_bracket()
    return jsonify(bracket), 200

@tournament_bp.route('/', methods=['POST'])
@require_auth
def create_tournament():
    """Create a new tournament (admin only)"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Tournament name is required'}), 400
        
        # Create a Tournament object with the data
        tournament = Tournament(
            name=data.get('name'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            location=data.get('location'),  # Legacy field
            location_id=data.get('location_id'),  # New field
            type=data.get('type', 'single_elimination'),
            has_pool_play=data.get('has_pool_play', False),
            min_teams=data.get('min_teams', 8),
            max_teams=data.get('max_teams', 32),
            teams_per_pool=data.get('teams_per_pool', 4),
            pool_sets=data.get('pool_sets', 2),
            bracket_sets=data.get('bracket_sets', 3)
        )
        
        # Validate min/max team settings
        if tournament.min_teams < 8 or tournament.min_teams > 32:
            return jsonify({'error': 'Minimum teams must be between 8 and 32'}), 400
            
        if tournament.max_teams < tournament.min_teams or tournament.max_teams > 32:
            return jsonify({'error': 'Maximum teams must be between min_teams and 32'}), 400
            
        if tournament.teams_per_pool < 2 or tournament.teams_per_pool > 6:
            return jsonify({'error': 'Teams per pool must be between 2 and 6'}), 400
        
        # Use the create method to save it
        tournament = Tournament.create(tournament)
        
        return jsonify(tournament.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tournament_bp.route('/<tournament_id>', methods=['PUT'])
@require_auth
def update_tournament(tournament_id):
    """Update a tournament (admin only)"""
    data = request.json
    tournament = Tournament.get(tournament_id)
    
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    # Update fields if provided
    if 'name' in data:
        tournament.name = data['name']
    
    if 'start_date' in data:
        tournament.start_date = data['start_date']
    
    if 'end_date' in data:
        tournament.end_date = data['end_date']
    
    if 'location' in data:
        tournament.location = data['location']
    
    if 'status' in data:
        tournament.status = data['status']
    
    # Save the updated tournament
    tournament = Tournament.update(tournament)
    
    return jsonify(tournament.to_dict()), 200

@tournament_bp.route('/<tournament_id>', methods=['DELETE'])
@require_auth
def delete_tournament(tournament_id):
    """Delete a tournament (admin only)"""
    tournament = Tournament.get(tournament_id)
    
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    tournament.delete()
    return jsonify({'message': 'Tournament deleted successfully'}), 200

@tournament_bp.route('/<tournament_id>/bracket', methods=['POST'])
@require_auth
def create_tournament_bracket(tournament_id):
    """Create the bracket for a tournament (admin only)"""
    data = request.json
    team_ids = data.get('team_ids', [])
    
    tournament = Tournament.get(tournament_id)
    
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    if not team_ids:
        return jsonify({'message': 'Team IDs are required'}), 400
    
    try:
        matches = tournament.create_bracket(team_ids)
        return jsonify({
            'message': 'Tournament bracket created successfully',
            'matches': [match.to_dict() for match in matches]
        }), 201
    except NotImplementedError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': f'Error creating bracket: {str(e)}'}), 500

@tournament_bp.route('/<tournament_id>/updates', methods=['GET'])
def get_tournament_updates(tournament_id):
    """Get recent updates for a tournament"""
    # Validate tournament
    tournament = Tournament.get(tournament_id)
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    # Get since timestamp if provided
    since_timestamp = request.args.get('since')
    if since_timestamp:
        try:
            since_timestamp = int(since_timestamp)
        except ValueError:
            return jsonify({'message': 'Invalid timestamp format'}), 400
    
    # Get limit if provided
    limit = request.args.get('limit', 20)
    try:
        limit = int(limit)
        if limit < 1 or limit > 50:
            limit = 20  # Default if out of range
    except ValueError:
        limit = 20  # Default if not a valid integer
    
    # Get updates
    updates = MatchUpdate.get_by_tournament(tournament_id, since_timestamp, limit)
    
    # Convert to dict for JSON response
    result = [update.to_dict() for update in updates]
    
    return jsonify(result), 200

@tournament_bp.route('/<tournament_id>/create-bracket-from-pools', methods=['POST'])
@require_auth
def create_bracket_from_pools(tournament_id):
    """Create a bracket for tournament based on pool play rankings"""
    try:
        tournament = Tournament.get(tournament_id)
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
            
        if not tournament.has_pool_play:
            return jsonify({'error': 'This tournament does not have pool play enabled'}), 400
            
        if not tournament.pool_play_complete:
            return jsonify({'error': 'Pool play must be completed before creating a bracket'}), 400
            
        # Get data from request
        data = request.get_json()
        bracket_size = data.get('bracket_size')
        
        # Validate bracket size
        if not bracket_size or bracket_size not in [4, 8, 12]:
            return jsonify({'error': 'Bracket size must be 4, 8, or 12 teams'}), 400
            
        tournament.bracket_size = bracket_size
        Tournament.update(tournament)
        
        # Get all pools for this tournament
        from models.pool import Pool
        from models.pool_standing import PoolStanding
        
        pools = Pool.get_by_tournament(tournament_id)
        if not pools:
            return jsonify({'error': 'No pools found for this tournament'}), 400
            
        # Get rankings from all pools
        all_rankings = []
        for pool in pools:
            standings = PoolStanding.get_by_pool(pool.pool_id)
            
            # Sort by rank within the pool
            standings.sort(key=lambda s: s.rank)
            
            # Add pool identifier to each standing
            for standing in standings:
                all_rankings.append({
                    'team_id': standing.team_id,
                    'pool_id': pool.pool_id,
                    'pool_name': pool.name,
                    'rank': standing.rank,
                    'win_percentage': standing.get_win_percentage(),
                    'points_differential': standing.get_points_differential()
                })
        
        # Sort teams for seeding based on multiple criteria
        # First by rank within their pool, then by win percentage, then by points differential
        all_rankings.sort(key=lambda r: (
            r['rank'],  # Lower rank (1st, 2nd, etc) comes first
            -r['win_percentage'],  # Higher win percentage comes first
            -r['points_differential']  # Higher point differential comes first
        ))
        
        # Take only the number of teams needed for the bracket
        if len(all_rankings) < bracket_size:
            return jsonify({
                'error': f'Not enough teams in pools. Need {bracket_size} teams, but only have {len(all_rankings)}'
            }), 400
            
        qualified_teams = all_rankings[:bracket_size]
        team_ids = [r['team_id'] for r in qualified_teams]
        
        # Create the bracket
        matches = tournament.create_bracket(team_ids)
        
        # Update tournament status
        tournament.status = 'bracket_play'
        Tournament.update(tournament)
        
        return jsonify({
            'message': f'Created bracket with {len(team_ids)} teams',
            'bracket': tournament.get_bracket(),
            'qualified_teams': qualified_teams
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
