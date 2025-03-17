from flask import request, jsonify
from flask_login import login_required
from backend.models.tournament import Tournament

@tournament_bp.route('/', methods=['POST'])
@login_required
def create_tournament():
    data = request.get_json()
    
    # Create a Tournament object with the data
    tournament = Tournament(
        name=data.get('name'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        location=data.get('location'),
        type=data.get('type', 'single_elimination')
    )
    
    # Use the create method to save it
    tournament = Tournament.create(tournament)
    
    return jsonify(tournament.to_dict()), 201

@tournament_bp.route('/<tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    tournament = Tournament.get(tournament_id)
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    return jsonify(tournament.to_dict())

@tournament_bp.route('/', methods=['GET'])
def get_all_tournaments():
    tournaments = Tournament.get_all()
    return jsonify([t.to_dict() for t in tournaments])

@tournament_bp.route('/<tournament_id>', methods=['PUT'])
@login_required
def update_tournament(tournament_id):
    data = request.get_json()
    tournament = Tournament.get(tournament_id)
    
    if not tournament:
        return jsonify({'message': 'Tournament not found'}), 404
    
    # Update tournament attributes
    tournament.name = data.get('name', tournament.name)
    tournament.start_date = data.get('start_date', tournament.start_date)
    tournament.end_date = data.get('end_date', tournament.end_date)
    tournament.location = data.get('location', tournament.location)
    tournament.type = data.get('type', tournament.type)
    tournament.status = data.get('status', tournament.status)
    
    # Save the updated tournament
    tournament = Tournament.update(tournament)
    
    return jsonify(tournament.to_dict()) 