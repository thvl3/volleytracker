# VolleyTracker

A web application for tracking volleyball tournaments, displaying live brackets, and managing scores.

## Features

- Public tournament bracket view for spectators
- Live score updates
- Secure admin interface for tournament managers
- Support for different tournament types (single elimination, etc.)
- Court assignment and scheduling
- DynamoDB integration for data persistence

## Quick Start with Docker

The easiest way to get started is using Docker:

1. Clone the repository:
   ```bash
   git clone https://github.com/thvl3/volleytracker.git
   cd volleytracker
   ```

2. Set up environment variables (optional - default values will work for development):
   - Create `.env` file in the project root with your configuration:
     ```
     DEBUG=True
     SECRET_KEY=your_secret_key_here
     ADMIN_PASSWORD=password
     JWT_SECRET_KEY=your_jwt_secret_here
     
     # For local DynamoDB
     DYNAMODB_ENDPOINT=http://localhost:8000
     AWS_REGION=us-east-1
     ```

3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access the application at http://localhost

## API Testing

You can use curl to test the API:

```bash
# Get all tournaments
curl http://localhost/api/tournaments/

# Login as admin
curl -X POST -H "Content-Type: application/json" -d '{"password": "password"}' http://localhost/api/auth/login

# Create a team (requires authentication)
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"team_name": "Team Name", "tournament_id": "TOURNAMENT_ID", "players": ["Player 1", "Player 2", "Player 3"]}' \
  http://localhost/api/teams/

# Create a tournament bracket (requires authentication)
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"team_ids": ["TEAM_ID_1", "TEAM_ID_2", "TEAM_ID_3"]}' \
  http://localhost/api/tournaments/TOURNAMENT_ID/bracket
```

## Project Structure

```
volleytracker/
├── backend/                 # Flask API
│   ├── controllers/         # API endpoint handlers
│   ├── models/              # Data models
│   ├── services/            # Business logic and services
│   ├── config.py            # Configuration settings
│   └── requirements.txt     # Python dependencies
├── frontend/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── api/             # API client code
│   └── package.json
├── docker-compose.yml       # Docker configuration
├── Dockerfile               # Docker build instructions
└── nginx.conf               # Nginx configuration
```

## DynamoDB Configuration

The application uses DynamoDB for data storage with the following tables:

- `VolleyDB_Teams`: Stores team information
- `VolleyDB_Matches`: Stores match information
- `VolleyDB_Tournaments`: Stores tournament information

These tables are automatically created when the application starts. The tables use a PAY_PER_REQUEST billing mode with appropriate Global Secondary Indexes for efficient querying.

## Development Setup

### Backend Development

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Run the development server:
   ```
   python app.py
   ```

### Frontend Development

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Run the development server:
   ```
   npm start
   ```

## Production Deployment

### Docker Deployment

The recommended way to deploy the application is using Docker:

1. Build the Docker image:
   ```bash
   docker build -t volleytracker .
   ```

2. Run the container:
   ```bash
   docker run -p 80:80 -e ADMIN_PASSWORD=your_secure_password -e SECRET_KEY=your_secret_key volleytracker
   ```

### AWS EC2 Deployment

1. Launch an EC2 instance with a recent version of Ubuntu.

2. Install Docker and Docker Compose:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/thvl3/volleytracker.git
   cd volleytracker
   ```

4. Start the application:
   ```bash
   docker-compose up -d
   ```

## Security Considerations

- For production use, always change the default passwords
- Set secure values for SECRET_KEY and JWT_SECRET_KEY
- Enable HTTPS when deploying to the internet
- Set up proper IAM roles for DynamoDB access in AWS

## Troubleshooting

### Common Issues

1. **DynamoDB Connection Issues:**
   - For local development, ensure DynamoDB local is running
   - For AWS, ensure proper IAM permissions are set

2. **Docker Issues:**
   - If you encounter port conflicts, modify the port mapping in docker-compose.yml

3. **Application Startup Issues:**
   - Check the logs using `docker logs volleytracker_app_1`
   - Ensure all environment variables are correctly set

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
