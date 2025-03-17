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
    """Get a specific tournament"""
    tournament = Tournament.get(tournament_id)
    
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    return jsonify(tournament.to_dict()), 200

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
    data = request.json
    name = data.get('name')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    location = data.get('location')
    tournament_type = data.get('type', 'single_elimination')
    
    # Validate required fields
    if not name:
        return jsonify({'message': 'Tournament name is required'}), 400
    
    # Create a Tournament object with the data
    tournament = Tournament(
        name=name,
        start_date=start_date,
        end_date=end_date,
        location=location,
        type=tournament_type
    )
    
    # Use the create method to save it
    tournament = Tournament.create(tournament)
    
    return jsonify(tournament.to_dict()), 201

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
