from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
import os
import logging
import time

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/login', methods=['POST'])
def login():
    """Login for admin users using only password"""
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password is required'}), 400
        
        # Get admin password from environment variable
        admin_password = os.getenv('ADMIN_PASSWORD', 'password')
        
        # Validate credentials
        if password != admin_password:
            return jsonify({'error': 'Invalid password'}), 401
        
        # Generate token
        token = AuthService.generate_token()
        
        return jsonify({
            'token': token,
            'message': 'Login successful'
        }), 200
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@admin_bp.route('/admin/validate-token', methods=['GET'])
def validate_token():
    """Validate an auth token"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'valid': False, 'error': 'Missing or invalid Authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        payload = AuthService.validate_token(token)
        
        if not payload:
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 401
        
        return jsonify({'valid': True, 'role': payload.get('role')}), 200
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}")
        return jsonify({'valid': False, 'error': 'An unexpected error occurred'}), 500 