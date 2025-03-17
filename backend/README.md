# Tournament System with Pool Play and Location Management

This extension to the VolleyTracker system adds comprehensive support for pool play, location management, and enhanced tournament scheduling.

## New Features

### Location Management
- Support for volleyball gym locations with courts, capacity, and features
- CRUD operations for managing locations
- Sample locations in Southern LA area pre-loaded

### Pool Play
- Tournaments can now have pool play followed by bracket play
- Teams are assigned to pools of 4 
- Pool matches consist of 2 sets
- Automatic team rankings based on pool performance
  - Win percentage
  - Points differential
  - Head-to-head results

### Enhanced Tournament Structure
- Support for tournaments with 8-32 teams
- Configurable pool size (default 4 teams per pool)
- Bracket sizes of 4, 8, or 12 teams
- Bracket matches are best 2 out of 3 sets

### Match Scoring
- Set-based scoring for matches
- Different configurations for pool play (2 sets) and bracket play (best 2 of 3)

## API Endpoints

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create a new location
- `GET /api/locations/{location_id}` - Get a specific location
- `PUT /api/locations/{location_id}` - Update a location
- `DELETE /api/locations/{location_id}` - Delete a location

### Pool Management
- `POST /api/tournaments/{tournament_id}/pools` - Create pools for a tournament
- `GET /api/tournaments/{tournament_id}/pools` - Get all pools for a tournament
- `GET /api/pools/{pool_id}` - Get a specific pool with teams and standings
- `PUT /api/pools/{pool_id}/teams` - Update teams in a pool
- `POST /api/pools/{pool_id}/schedule` - Generate a round-robin schedule for a pool
- `GET /api/pools/{pool_id}/matches` - Get all matches for a pool

### Pool Match Management
- `GET /api/pool-matches/{match_id}` - Get a specific pool match
- `GET /api/tournaments/{tournament_id}/pool-matches` - Get all pool matches for a tournament
- `PUT /api/pool-matches/{match_id}/score` - Update the score for a pool match
- `PUT /api/pool-matches/{match_id}/schedule` - Update the court and time for a pool match

### Tournament Enhancements
- `POST /api/tournaments/{tournament_id}/complete-pool-play` - Mark pool play as complete
- `POST /api/tournaments/{tournament_id}/create-bracket-from-pools` - Create a bracket from pool rankings
- `GET /api/tournaments/{tournament_id}/rankings` - Get team rankings across all pools
- `GET /api/pools/{pool_id}/rankings` - Get team rankings for a specific pool

## Data Model Updates

- **Tournament**: Added fields for pool play, minimum/maximum teams, and bracket configuration
- **Match**: Enhanced to support set-based scoring and location assignment
- **New Models**:
  - **Location**: For managing volleyball gym locations
  - **Pool**: For managing teams in pools
  - **PoolMatch**: For tracking matches in pool play
  - **PoolStanding**: For tracking team standings within pools

## Setup

1. Initialize the database:
```bash
cd backend
bash scripts/setup_database.sh
```

2. Create a new tournament with pool play:
```bash
curl -X POST http://localhost:5000/api/tournaments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Summer Tournament with Pool Play",
    "has_pool_play": true,
    "teams_per_pool": 4,
    "location_id": "YOUR_LOCATION_ID"
  }' 