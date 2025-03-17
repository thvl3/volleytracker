from flask import Blueprint, request, jsonify
from models.pool_match import PoolMatch
from models.pool_standing import PoolStanding
from models.team import Team
from models.pool import Pool
from models.location import Location
from middleware.auth_middleware import require_auth
import logging

logger = logging.getLogger(__name__)

pool_match_controller = Blueprint('pool_match_controller', __name__)

@pool_match_controller.route('/pool-matches/<match_id>', methods=['GET'])
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

@pool_match_controller.route('/tournaments/<tournament_id>/pool-matches', methods=['GET'])
def get_tournament_pool_matches(tournament_id):
    """Get all pool matches for a tournament"""
    try:
        matches = PoolMatch.get_by_tournament(tournament_id)
        
        # Get team names for each match
        result = []
        for match in matches:
            match_dict = match.to_dict()
            
            team1 = Team.get(match.team1_id) if match.team1_id else None
            team2 = Team.get(match.team2_id) if match.team2_id else None
            
            match_dict['team1_name'] = team1.team_name if team1 else None
            match_dict['team2_name'] = team2.team_name if team2 else None
            
            result.append(match_dict)
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting tournament pool matches: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_match_controller.route('/pool-matches/<match_id>/score', methods=['PUT'])
@require_auth
def update_pool_match_score(match_id):
    """Update the score for a specific set in a pool match"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        set_number = data.get('set_number')
        team1_score = data.get('team1_score')
        team2_score = data.get('team2_score')
        
        if set_number is None:
            return jsonify({'error': 'Set number is required'}), 400
            
        if team1_score is None or team2_score is None:
            return jsonify({'error': 'Scores for both teams are required'}), 400
            
        match = PoolMatch.get(match_id)
        if not match:
            return jsonify({'error': 'Match not found'}), 404
            
        # Update the score
        match.update_set_score(set_number, team1_score, team2_score)
        
        # Get updated match data
        updated_match = PoolMatch.get(match_id)
        result = updated_match.to_dict()
        
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
        
        return jsonify(result), 200
    except ValueError as e:
        logger.error(f"Validation error updating pool match score: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error updating pool match score: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_match_controller.route('/pool-matches/<match_id>/schedule', methods=['PUT'])
@require_auth
def update_pool_match_schedule(match_id):
    """Update the court and time for a pool match"""
    try:
        data = request.get_json()
        match = PoolMatch.get(match_id)
        
        if not match:
            return jsonify({'error': 'Match not found'}), 404
            
        # Update court if provided
        if 'location_id' in data and 'court_number' in data:
            match.location_id = data['location_id']
            match.court_number = data['court_number']
            
        # Update time if provided
        if 'scheduled_time' in data:
            scheduled_time = data['scheduled_time']
            if not isinstance(scheduled_time, int):
                return jsonify({'error': 'Scheduled time must be a unix timestamp'}), 400
                
            match.scheduled_time = scheduled_time
            
        match.update()
        return jsonify(match.to_dict()), 200
    except Exception as e:
        logger.error(f"Error updating pool match schedule: {str(e)}")
        return jsonify({'error': str(e)}), 500

@pool_match_controller.route('/pool-matches/<match_id>', methods=['DELETE'])
@require_auth
def delete_pool_match(match_id):
    """Delete a pool match"""
    try:
        match = PoolMatch.get(match_id)
        if not match:
            return jsonify({'error': 'Match not found'}), 404
            
        match.delete()
        return jsonify({'message': 'Match deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting pool match: {str(e)}")
        return jsonify({'error': str(e)}), 500 