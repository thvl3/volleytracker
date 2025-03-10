import boto3
from botocore.exceptions import ClientError
import logging
from config import Config

logger = logging.getLogger(__name__)

class DynamoDBService:
    def __init__(self):
        """Initialize DynamoDB client"""
        options = {}
        if Config.DYNAMODB_ENDPOINT:
            options['endpoint_url'] = Config.DYNAMODB_ENDPOINT
        
        self.dynamodb = boto3.resource('dynamodb', region_name=Config.AWS_REGION, **options)
        self.client = boto3.client('dynamodb', region_name=Config.AWS_REGION, **options)
        
        # Initialize tables
        self.teams_table = self.dynamodb.Table(Config.TEAMS_TABLE)
        self.matches_table = self.dynamodb.Table(Config.MATCHES_TABLE)
        self.tournaments_table = self.dynamodb.Table(Config.TOURNAMENTS_TABLE)

    def create_tables_if_not_exists(self):
        """Create DynamoDB tables if they don't exist"""
        existing_tables = self.client.list_tables()['TableNames']
        
        # Create teams table if it doesn't exist
        if Config.TEAMS_TABLE not in existing_tables:
            self._create_teams_table()
            
        # Create matches table if it doesn't exist
        if Config.MATCHES_TABLE not in existing_tables:
            self._create_matches_table()
            
        # Create tournaments table if it doesn't exist
        if Config.TOURNAMENTS_TABLE not in existing_tables:
            self._create_tournaments_table()
    
    def _create_teams_table(self):
        """Create teams table"""
        try:
            self.client.create_table(
                TableName=Config.TEAMS_TABLE,
                KeySchema=[
                    {'AttributeName': 'team_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'team_id', 'AttributeType': 'S'},
                    {'AttributeName': 'tournament_id', 'AttributeType': 'S'}
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'TournamentIndex',
                        'KeySchema': [
                            {'AttributeName': 'tournament_id', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'},
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                ],
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            logger.info(f"Created table: {Config.TEAMS_TABLE}")
        except ClientError as e:
            logger.error(f"Error creating table {Config.TEAMS_TABLE}: {e}")
            raise
    
    def _create_matches_table(self):
        """Create matches table"""
        try:
            self.client.create_table(
                TableName=Config.MATCHES_TABLE,
                KeySchema=[
                    {'AttributeName': 'match_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'match_id', 'AttributeType': 'S'},
                    {'AttributeName': 'tournament_id', 'AttributeType': 'S'},
                    {'AttributeName': 'status', 'AttributeType': 'S'}
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'TournamentStatusIndex',
                        'KeySchema': [
                            {'AttributeName': 'tournament_id', 'KeyType': 'HASH'},
                            {'AttributeName': 'status', 'KeyType': 'RANGE'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'},
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                ],
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            logger.info(f"Created table: {Config.MATCHES_TABLE}")
        except ClientError as e:
            logger.error(f"Error creating table {Config.MATCHES_TABLE}: {e}")
            raise
    
    def _create_tournaments_table(self):
        """Create tournaments table"""
        try:
            self.client.create_table(
                TableName=Config.TOURNAMENTS_TABLE,
                KeySchema=[
                    {'AttributeName': 'tournament_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'tournament_id', 'AttributeType': 'S'}
                ],
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            logger.info(f"Created table: {Config.TOURNAMENTS_TABLE}")
        except ClientError as e:
            logger.error(f"Error creating table {Config.TOURNAMENTS_TABLE}: {e}")
            raise

# Create a singleton instance
db_service = DynamoDBService()
