from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os
from config import Config
from services.db_service import DynamoDBService

# Import controllers
from controllers.tournament_controller import tournament_bp
from controllers.team_controller import team_bp
from controllers.match_controller import match_bp
from controllers.location_controller import location_controller
from controllers.pool_controller import pool_controller
from controllers.pool_match_controller import pool_match_controller
from controllers.admin_controller import admin_bp

app = Flask(__name__, static_folder='../frontend/build')
app.config.from_object(Config)

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize DynamoDB service
db_service = DynamoDBService()
db_service.create_tables_if_not_exists()

# Register blueprints with correct URL prefixes
app.register_blueprint(tournament_bp, url_prefix='/api/tournaments')
app.register_blueprint(team_bp, url_prefix='/api/teams')
app.register_blueprint(match_bp, url_prefix='/api/matches')
app.register_blueprint(location_controller, url_prefix='/api')  # This one has full paths already
app.register_blueprint(pool_controller, url_prefix='/api')  # This one has full paths already
app.register_blueprint(pool_match_controller, url_prefix='/api')  # This one has full paths already
app.register_blueprint(admin_bp, url_prefix='/api')  # This one has full paths already

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
