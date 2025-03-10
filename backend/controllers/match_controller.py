from flask import Blueprint, request, jsonify
from models.match import Match
from services.auth_service import AuthService

match_bp = Blueprint('match', __name__)

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

@match_bp.route('/', methods=['GET'])
def get_matches():
    """Get all matches for a tournament"""
    tournament_id = request.args.get('tournament_id')
    status = request.args.get('status')
    
    if not tournament_id:
        return jsonify({'message': 'Tournament ID is required'}), 400
    
    matches = Match.get_by_tournament_status(tournament_id, status)
    return jsonify([match.to_dict() for match in matches]), 200

@match_bp.route('/<match_id>', methods=['GET'])
def get_match(match_id):
    """Get a specific match"""
    match = Match.get(match_id)
    
    if not match:
        return jsonify({'message': 'Match not found'}), 404
    
    return jsonify(match.to_dict()), 200

@match_bp.route('/<match_id>/score', methods=['POST'])
@require_auth
def update_score(match_id):
    """Update the score for a match (admin only)"""
    data = request.json
    score_team1 = data.get('score_team1')
    score_team2 = data.get('score_team2')
    
    match = Match.get(match_id)
    if not match:
        return jsonify({'message': 'Match not found'}), 404
    
    # Validate scores
    if score_team1 is None or score_team2 is None:
        return jsonify({'message': 'Both scores are required'}), 400
    
    match.update_score(score_team1, score_team2)
    
    # Check if match has winner
    if data.get('complete', False):
        match.complete_match()
    
    return jsonify(match.to_dict()), 200

@match_bp.route('/<match_id>/court', methods=['POST'])
@require_auth
def update_court(match_id):
    """Update the court for a match (admin only)"""
    data = request.json
    court = data.get('court')
    
    match = Match.get(match_id)
    if not match:
        return jsonify({'message': 'Match not found'}), 404
    
    match.court = court
    match.update()
    
    return jsonify(match.to_dict()), 200

@match_bp.route('/<match_id>/schedule', methods=['POST'])
@require_auth
def update_schedule(match_id):
    """Update the scheduled time for a match (admin only)"""
    data = request.json
    scheduled_time = data.get('scheduled_time')
    
    match = Match.get(match_id)
    if not match:
        return jsonify({'message': 'Match not found'}), 404
    
    match.scheduled_time = scheduled_time
    match.update()
    
    return jsonify(match.to_dict()), 200
