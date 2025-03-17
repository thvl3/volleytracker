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
        
        # Define table names
        self.TOURNAMENTS_TABLE = 'VolleyDB_Tournaments'
        self.TEAMS_TABLE = 'VolleyDB_Teams' 
        self.MATCHES_TABLE = 'VolleyDB_Matches'
        
        # Initialize tables
        self.tournaments_table = self.dynamodb.Table(self.TOURNAMENTS_TABLE)
        self.teams_table = self.dynamodb.Table(self.TEAMS_TABLE)
        self.matches_table = self.dynamodb.Table(self.MATCHES_TABLE)

    def create_tables_if_not_exists(self):
        """Create DynamoDB tables if they don't exist"""
        existing_tables = self.client.list_tables()['TableNames']
        
        # Create Tournaments table if it doesn't exist
        if self.TOURNAMENTS_TABLE not in existing_tables:
            self._create_tournaments_table()
            
        # Create Teams table if it doesn't exist
        if self.TEAMS_TABLE not in existing_tables:
            self._create_teams_table()
            
        # Create Matches table if it doesn't exist
        if self.MATCHES_TABLE not in existing_tables:
            self._create_matches_table()

    def _create_tournaments_table(self):
        """Create tournaments table"""
        try:
            self.client.create_table(
                TableName=self.TOURNAMENTS_TABLE,
                KeySchema=[
                    {'AttributeName': 'tournament_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'tournament_id', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            logger.info(f"Created table: {self.TOURNAMENTS_TABLE}")
        except ClientError as e:
            logger.error(f"Error creating table {self.TOURNAMENTS_TABLE}: {e}")
            raise
    
    def _create_teams_table(self):
        """Create teams table"""
        try:
            self.client.create_table(
                TableName=self.TEAMS_TABLE,
                KeySchema=[
                    {'AttributeName': 'team_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'team_id', 'AttributeType': 'S'},
                    {'AttributeName': 'tournament_id', 'AttributeType': 'S'}
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'TournamentTeamsIndex',
                        'KeySchema': [
                            {'AttributeName': 'tournament_id', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            logger.info(f"Created table: {self.TEAMS_TABLE}")
        except ClientError as e:
            logger.error(f"Error creating table {self.TEAMS_TABLE}: {e}")
            raise
    
    def _create_matches_table(self):
        """Create matches table"""
        try:
            self.client.create_table(
                TableName=self.MATCHES_TABLE,
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
                        'IndexName': 'TournamentMatchesIndex',
                        'KeySchema': [
                            {'AttributeName': 'tournament_id', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    },
                    {
                        'IndexName': 'TournamentStatusIndex',
                        'KeySchema': [
                            {'AttributeName': 'tournament_id', 'KeyType': 'HASH'},
                            {'AttributeName': 'status', 'KeyType': 'RANGE'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            logger.info(f"Created table: {self.MATCHES_TABLE}")
        except ClientError as e:
            logger.error(f"Error creating table {self.MATCHES_TABLE}: {e}")
            raise

# Create a singleton instance
db_service = DynamoDBService()
