import sys
import os
import time

# Add the parent directory to the path so we can import the backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.db_service import db_service
from backend.models.tournament import Tournament
from backend.models.team import Team
from backend.models.match import Match

def create_sample_tournament():
    """Create a sample tournament with teams and matches"""
    print("Creating sample tournament...")
    
    # Create a tournament
    tournament = Tournament.create(
        name="Hayes Volleyball Summer Cup 2025",
        start_date=int(time.time()),
        end_date=int(time.time()) + 86400 * 2,  # 2 days later
        location="City Sports Arena",
        type="single_elimination"
    )
    
    print(f"Created tournament: {tournament.name} (ID: {tournament.tournament_id})")
    
    # Create teams
    teams = []
    team_names = [
        "Spike Masters", "Net Ninjas", "Beach Kings", "Volley Stars",
        "Sand Strikers", "High Flyers", "Serve Aces", "Block Party"
    ]
    
    for name in team_names:
        team = Team.create(
            team_name=name,
            tournament_id=tournament.tournament_id,
            players=[f"Player {i+1}" for i in range(6)]  # 6 players per team
        )
        teams.append(team)
        print(f"Created team: {team.team_name} (ID: {team.team_id})")
    
    # Create bracket
    team_ids = [team.team_id for team in teams]
    matches = tournament.create_bracket(team_ids)
    
    print(f"Created tournament bracket with {len(matches)} matches")
    print("Sample data creation complete!")

def main():
    print("Initializing DynamoDB tables...")
    db_service.create_tables_if_not_exists()
    print("Tables created successfully!")
    
    # Ask if sample data should be created
    create_sample = input("Do you want to create sample tournament data? (y/n): ")
    if create_sample.lower() == 'y':
        create_sample_tournament()

if __name__ == "__main__":
    main()
