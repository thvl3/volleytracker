from flask import Blueprint, request, jsonify
from models.team import Team
from services.auth_service import AuthService

team_bp = Blueprint('team', __name__)

# Auth middleware
def require_auth(f):
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

@team_bp.route('/', methods=['GET'])
def get_teams():
    """Get all teams for a tournament"""
    tournament_id = request.args.get('tournament_id')
    
    if not tournament_id:
        return jsonify({'message': 'Tournament ID is required'}), 400
    
    teams = Team.get_by_tournament(tournament_id)
    return jsonify([team.to_dict() for team in teams]), 200

@team_bp.route('/<team_id>', methods=['GET'])
def get_team(team_id):
    """Get a specific team"""
    team = Team.get(team_id)
    
    if not team:
        return jsonify({'message': 'Team not found'}), 404
    
    return jsonify(team.to_dict()), 200

@team_bp.route('/', methods=['POST'])
@require_auth
def create_team():
    """Create a new team (admin only)"""
    data = request.json
    team_name = data.get('team_name')
    tournament_id = data.get('tournament_id')
    players = data.get('players', [])
    
    # Validate required fields
    if not team_name or not tournament_id:
        return jsonify({'message': 'Team name and tournament ID are required'}), 400
    
    team = Team.create(team_name, tournament_id, players)
    return jsonify(team.to_dict()), 201

@team_bp.route('/<team_id>', methods=['PUT'])
@require_auth
def update_team(team_id):
    """Update a team (admin only)"""
    data = request.json
    team = Team.get(team_id)
    
    if not team:
        return jsonify({'message': 'Team not found'}), 404
    
    # Update fields if provided
    if 'team_name' in data:
        team.team_name = data['team_name']
    
    if 'players' in data:
        team.players = data['players']
    
    team.update()
    return jsonify(team.to_dict()), 200

@team_bp.route('/<team_id>', methods=['DELETE'])
@require_auth
def delete_team(team_id):
    """Delete a team (admin only)"""
    team = Team.get(team_id)
    
    if not team:
        return jsonify({'message': 'Team not found'}), 404
    
    team.delete()
    return jsonify({'message': 'Team deleted successfully'}), 200
