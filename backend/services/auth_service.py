import jwt
import time
from config import Config
import bcrypt

class AuthService:
    @staticmethod
    def validate_admin_password(password):
        """Validate the admin master password"""
        return password == Config.ADMIN_PASSWORD
    
    @staticmethod
    def generate_token(role='admin'):
        """Generate a JWT token for the admin role"""
        payload = {
            'role': role,
            'exp': time.time() + Config.JWT_ACCESS_TOKEN_EXPIRES,
            'iat': time.time()
        }
        
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
    
    @staticmethod
    def validate_token(token):
        """Validate a JWT token"""
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            if payload['exp'] < time.time():
                return None  # Token expired
            
            return payload
        except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
            return None
