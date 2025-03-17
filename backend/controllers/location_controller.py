from flask import Blueprint, request, jsonify
from models.location import Location
from middleware.auth_middleware import require_auth
import logging

logger = logging.getLogger(__name__)

location_controller = Blueprint('location_controller', __name__)

@location_controller.route('/locations', methods=['GET'])
def get_all_locations():
    """Get all locations"""
    try:
        locations = Location.get_all()
        return jsonify([loc.to_dict() for loc in locations]), 200
    except Exception as e:
        logger.error(f"Error getting locations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@location_controller.route('/locations/<location_id>', methods=['GET'])
def get_location(location_id):
    """Get a specific location by ID"""
    try:
        location = Location.get(location_id)
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        return jsonify(location.to_dict()), 200
    except Exception as e:
        logger.error(f"Error getting location: {str(e)}")
        return jsonify({'error': str(e)}), 500

@location_controller.route('/locations', methods=['POST'])
@require_auth
def create_location():
    """Create a new location"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('address'):
            return jsonify({'error': 'Name and address are required'}), 400
        
        if not data.get('courts') or not isinstance(data.get('courts'), int) or data.get('courts') < 1 or data.get('courts') > 4:
            return jsonify({'error': 'Number of courts must be between 1 and 4'}), 400
        
        # Create location
        location = Location.create(
            name=data.get('name'),
            address=data.get('address'),
            courts=data.get('courts'),
            capacity=data.get('capacity', 0),
            features=data.get('features', [])
        )
        
        return jsonify(location.to_dict()), 201
    except Exception as e:
        logger.error(f"Error creating location: {str(e)}")
        return jsonify({'error': str(e)}), 500

@location_controller.route('/locations/<location_id>', methods=['PUT'])
@require_auth
def update_location(location_id):
    """Update an existing location"""
    try:
        data = request.get_json()
        location = Location.get(location_id)
        
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        
        # Update fields
        if 'name' in data:
            location.name = data['name']
        if 'address' in data:
            location.address = data['address']
        if 'courts' in data:
            location.courts = data['courts']
        if 'capacity' in data:
            location.capacity = data['capacity']
        if 'features' in data:
            location.features = data['features']
        
        # Save changes
        location.update()
        
        return jsonify(location.to_dict()), 200
    except Exception as e:
        logger.error(f"Error updating location: {str(e)}")
        return jsonify({'error': str(e)}), 500

@location_controller.route('/locations/<location_id>', methods=['DELETE'])
@require_auth
def delete_location(location_id):
    """Delete a location"""
    try:
        location = Location.get(location_id)
        
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        
        # Delete the location
        location.delete()
        
        return jsonify({'message': 'Location deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting location: {str(e)}")
        return jsonify({'error': str(e)}), 500 