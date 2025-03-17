# Build frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build backend and setup Nginx
FROM python:3.9-slim
WORKDIR /app

# Install Nginx and supervisor
RUN apt-get update && apt-get install -y nginx supervisor && \
    rm -rf /var/lib/apt/lists/* && \
    rm /etc/nginx/sites-enabled/default

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code
COPY backend/ .

# Copy frontend build from previous stage
COPY --from=frontend-build /app/frontend/build /app/static

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Setup supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port
EXPOSE 80 5000

# Start supervisor (which manages Nginx and Gunicorn)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
