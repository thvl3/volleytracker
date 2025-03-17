from flask import Blueprint, request, jsonify
from models.pool_match import PoolMatch
from models.pool_standing import PoolStanding
from models.team import Team
from middleware.auth_middleware import require_auth
import logging

logger = logging.getLogger(__name__)

pool_match_controller = Blueprint('pool_match_controller', __name__)

@pool_match_controller.route('/pool-matches/<match_id>', methods=['GET'])
def get_pool_match(match_id):
    """Get a pool match by ID"""
    try:
        match = PoolMatch.get(match_id)
        if not match:
            return jsonify({'error': 'Match not found'}), 404
            
        # Get team names for the response
        team1 = Team.get(match.team1_id) if match.team1_id else None
        team2 = Team.get(match.team2_id) if match.team2_id else None
        
        response = match.to_dict()
        response['team1_name'] = team1.team_name if team1 else None
        response['team2_name'] = team2.team_name if team2 else None
        
        return jsonify(response), 200
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
    """Update the score for a pool match"""
    try:
        data = request.get_json()
        match = PoolMatch.get(match_id)
        
        if not match:
            return jsonify({'error': 'Match not found'}), 404
            
        # Validate set number
        set_number = data.get('set_number')
        if not set_number or not isinstance(set_number, int) or set_number < 1 or set_number > match.num_sets:
            return jsonify({'error': f'Set number must be between 1 and {match.num_sets}'}), 400
            
        # Validate scores
        team1_score = data.get('team1_score')
        team2_score = data.get('team2_score')
        
        if team1_score is None or not isinstance(team1_score, int) or team1_score < 0:
            return jsonify({'error': 'Team 1 score must be a non-negative integer'}), 400
            
        if team2_score is None or not isinstance(team2_score, int) or team2_score < 0:
            return jsonify({'error': 'Team 2 score must be a non-negative integer'}), 400
            
        # Update the score
        match.update_set_score(set_number, team1_score, team2_score)
        
        # If match is completed, update standings
        if match.status == 'completed':
            # Get and update team standings
            if match.team1_id and match.team2_id:
                # Team 1 standings
                standing1 = PoolStanding.get_by_team_and_pool(match.team1_id, match.pool_id)
                if standing1:
                    # Update wins, losses, sets won/lost, points scored/allowed
                    sets_won_team1 = sum(1 for s1, s2 in zip(match.scores_team1, match.scores_team2) if s1 > s2)
                    sets_lost_team1 = sum(1 for s1, s2 in zip(match.scores_team1, match.scores_team2) if s1 < s2)
                    points_scored_team1 = sum(match.scores_team1)
                    points_allowed_team1 = sum(match.scores_team2)
                    
                    standing1.update_stats(
                        sets_won=sets_won_team1, 
                        sets_lost=sets_lost_team1,
                        points_scored=points_scored_team1,
                        points_allowed=points_allowed_team1
                    )
                    
                    # Update wins/losses based on match result
                    winner_id = match.get_winner_id()
                    if winner_id == match.team1_id:
                        standing1.update_stats(wins=1)
                    elif winner_id == match.team2_id:
                        standing1.update_stats(losses=1)
                    else:
                        standing1.update_stats(ties=1)
                
                # Team 2 standings
                standing2 = PoolStanding.get_by_team_and_pool(match.team2_id, match.pool_id)
                if standing2:
                    # Update wins, losses, sets won/lost, points scored/allowed
                    sets_won_team2 = sum(1 for s1, s2 in zip(match.scores_team1, match.scores_team2) if s1 < s2)
                    sets_lost_team2 = sum(1 for s1, s2 in zip(match.scores_team1, match.scores_team2) if s1 > s2)
                    points_scored_team2 = sum(match.scores_team2)
                    points_allowed_team2 = sum(match.scores_team1)
                    
                    standing2.update_stats(
                        sets_won=sets_won_team2, 
                        sets_lost=sets_lost_team2,
                        points_scored=points_scored_team2,
                        points_allowed=points_allowed_team2
                    )
                    
                    # Update wins/losses based on match result
                    winner_id = match.get_winner_id()
                    if winner_id == match.team2_id:
                        standing2.update_stats(wins=1)
                    elif winner_id == match.team1_id:
                        standing2.update_stats(losses=1)
                    else:
                        standing2.update_stats(ties=1)
                
                # Recalculate all rankings in the pool
                standings = PoolStanding.get_by_pool(match.pool_id)
                sorted_standings = sorted(
                    standings,
                    key=lambda s: (
                        -s.get_win_percentage(),
                        -s.get_points_differential()
                    )
                )
                
                # Update the rank for each team
                for i, standing in enumerate(sorted_standings):
                    standing.assign_rank(i + 1)
        
        return jsonify(match.to_dict()), 200
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