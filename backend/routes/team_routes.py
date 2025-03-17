from flask import request, jsonify
from flask_login import login_required
from backend.models.team import Team
from backend.models.tournament import Tournament

@team_bp.route('/', methods=['POST'])
@login_required
def create_team():
    data = request.get_json()
    team_name = data.get('team_name')
    tournament_id = data.get('tournament_id')
    players = data.get('players', [])
    
    if not team_name or not tournament_id:
        return jsonify({'message': 'Team name and tournament ID are required'}), 400
    
    # Check if tournament exists
    tournament = Tournament.get(tournament_id)
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    team = Team.create(team_name, tournament_id, players)
    return jsonify(team.to_dict()), 201

@team_bp.route('/<team_id>', methods=['GET'])
def get_team(team_id):
    team = Team.get(team_id)
    if not team:
        return jsonify({'message': 'Team not found'}), 404
    
    return jsonify(team.to_dict())

@team_bp.route('/', methods=['GET'])
def get_all_teams():
    tournament_id = request.args.get('tournament_id')
    
    if tournament_id:
        teams = Team.get_all(tournament_id)
    else:
        teams = Team.get_all()
    
    return jsonify([t.to_dict() for t in teams])

@team_bp.route('/<team_id>', methods=['PUT'])
@login_required
def update_team(team_id):
    data = request.get_json()
    team = Team.get(team_id)
    
    if not team:
        return jsonify({'message': 'Team not found'}), 404
    
    # Update team attributes
    team.team_name = data.get('team_name', team.team_name)
    team.players = data.get('players', team.players)
    
    # Save the updated team
    team = Team.update(team)
    
    return jsonify(team.to_dict()) 