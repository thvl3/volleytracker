# Build stage for React frontend
FROM node:16-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Copy frontend .env file if it exists
COPY frontend/.env* ./
RUN npm run build

# Backend stage
FROM python:3.9-slim
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build ./backend/static/

# Copy backend .env file if it exists
COPY backend/.env* ./

# Set environment variables
ENV FLASK_APP=backend/app.py
ENV PYTHONPATH=/app

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.wsgi:app"]

# Nginx stage
FROM nginx:alpine
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
