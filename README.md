# VolleyTracker

A web application for tracking volleyball tournaments, displaying live brackets, and managing scores.

## Features

- Public tournament bracket view for spectators
- Live score updates
- Secure admin interface for tournament managers
- Support for different tournament types (single elimination, etc.)
- Court assignment and scheduling

## Quick Start with Docker

1. Set up environment variables:
   - Create `.env` file in the `backend` directory with your configuration
   - Create `.env` file in the `frontend` directory with your configuration

2. Build and run the Docker container:
   ```bash
   docker build -t volleytracker .
   docker run -p 80:80 volleytracker
   ```

3. Access the application at http://localhost

Alternatively you can use curl to test the API:
```bash
curl -X GET http://localhost:5000/api/tournaments
```

## Project Structure

```
volleytracker/
├── backend/              # Flask API
│   ├── app.py            # Main application entry point
│   ├── config.py         # Configuration settings
│   ├── controllers/      # API endpoint handlers
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   └── requirements.txt  # Python dependencies
├── frontend/             # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── api/          # API client code
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main React component
│   └── package.json
└── docker-compose.yml    # For development
```

## Backend Setup

### Development Environment

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

3. Create a `.env` file in the `backend` directory with the following variables:
   ```
   DEBUG=True
   SECRET_KEY=your_secret_key
   ADMIN_PASSWORD=your_admin_password
   JWT_SECRET_KEY=your_jwt_secret
   
   # For local DynamoDB
   DYNAMODB_ENDPOINT=http://localhost:8000
   AWS_REGION=us-east-1
   ```

4. Run the development server:
   ```
   python app.py
   ```

### AWS Deployment

1. Set up an EC2 instance with Amazon Linux 2.

2. Install dependencies:
   ```
   sudo yum update -y
   sudo yum install -y python3 python3-pip nginx
   ```

3. Clone the repository:
   ```
   git clone https://github.com/thvl3/volleytracker.git
   cd volleytracker
   ```

4. Set up the Python environment:
   ```
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   pip install gunicorn
   ```

5. Create a `.env` file in the backend directory with production settings.

6. Set up Nginx:
   ```
   sudo nano /etc/nginx/conf.d/volleytracker.conf
   ```
   
   Add the following configuration:
   ```
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location / {
           root /home/ec2-user/volleytracker/frontend/build;
           index index.html;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

7. Set up systemd service:
   ```
   sudo nano /etc/systemd/system/volleytracker.service
   ```
   
   Add the following configuration:
   ```
   [Unit]
   Description=VolleyTracker Gunicorn service
   After=network.target

   [Service]
   User=ec2-user
   Group=ec2-user
   WorkingDirectory=/home/ec2-user/volleytracker/backend
   ExecStart=/home/ec2-user/volleytracker/venv/bin/gunicorn --bind 0.0.0.0:5000 wsgi:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

8. Start the services:
   ```
   sudo systemctl enable volleytracker
   sudo systemctl start volleytracker
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

## Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. For development:
   ```
   npm start
   ```

4. For production build:
   ```
   npm run build
   ```

## DynamoDB Setup

1. Create the necessary tables in AWS DynamoDB:
   - `volleytracker-teams`
   - `volleytracker-matches`
   - `volleytracker-tournaments`

   Or use the application's built-in table creation by running:
   ```python
   from services.db_service import db_service
   db_service.create_tables_if_not_exists()
   ```

## AWS Services Used

- EC2: Hosts the application
- DynamoDB: Stores tournament data
- Route 53: DNS management (optional)
- CloudFront: Content delivery (optional)

## Security Considerations

- Change all default passwords in production
- Store secrets in AWS Secrets Manager
- Enable HTTPS using AWS Certificate Manager
- Set up proper IAM roles for DynamoDB access
