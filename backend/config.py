import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_key_change_in_production')
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 't')
    
    # AWS Configuration
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
    DYNAMODB_ENDPOINT = os.environ.get('DYNAMODB_ENDPOINT', None)
    
    # DynamoDB Tables
    TEAMS_TABLE = os.environ.get('TEAMS_TABLE', 'volleytracker-teams')
    MATCHES_TABLE = os.environ.get('MATCHES_TABLE', 'volleytracker-matches')
    TOURNAMENTS_TABLE = os.environ.get('TOURNAMENTS_TABLE', 'volleytracker-tournaments')
    
    # Admin configuration
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')  # Change in production!
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_secret_change_in_production')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
