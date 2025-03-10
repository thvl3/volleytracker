from flask import Blueprint, request, jsonify
from services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Admin login with master password"""
    data = request.json
    password = data.get('password')
    
    if not password:
        return jsonify({'message': 'Password is required'}), 400
    
    # Validate password
    if AuthService.validate_admin_password(password):
        token = AuthService.generate_token()
        return jsonify({'token': token, 'message': 'Login successful'}), 200
    
    return jsonify({'message': 'Invalid password'}), 401

@auth_bp.route('/validate', methods=['POST'])
def validate_token():
    """Validate a JWT token"""
    data = request.json
    token = data.get('token')
    
    if not token:
        return jsonify({'valid': False, 'message': 'Token is required'}), 400
    
    payload = AuthService.validate_token(token)
    if payload:
        return jsonify({'valid': True, 'payload': payload}), 200
    
    return jsonify({'valid': False, 'message': 'Invalid or expired token'}), 401
