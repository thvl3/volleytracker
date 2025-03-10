from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from config import Config

# Import controllers
from controllers.auth_controller import auth_bp
from controllers.match_controller import match_bp
from controllers.team_controller import team_bp
from controllers.tournament_controller import tournament_bp

app = Flask(__name__, static_folder='../frontend/build')
app.config.from_object(Config)

# Configure CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(match_bp, url_prefix='/api/matches')
app.register_blueprint(team_bp, url_prefix='/api/teams')
app.register_blueprint(tournament_bp, url_prefix='/api/tournaments')

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
