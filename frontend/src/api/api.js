import axios from 'axios';

// Base API URL from environment variable or default to localhost
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, redirect to login
      if (window.location.pathname !== '/admin/login') {
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (password) => api.post('/auth/login', { password }),
  validate: (token) => api.post('/auth/validate', { token }),
};

// Tournament API
export const tournamentAPI = {
  getAll: () => api.get('/tournaments'),
  getById: (id) => api.get(`/tournaments/${id}`),
  getBracket: (id) => api.get(`/tournaments/${id}/bracket`),
  getUpdates: (id, since) => api.get(`/tournaments/${id}/updates`, { params: { since } }),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  createBracket: (id, teamIds) => api.post(`/tournaments/${id}/bracket`, { team_ids: teamIds }),
};

// Team API
export const teamAPI = {
  getByTournament: (tournamentId) => api.get('/teams', { params: { tournament_id: tournamentId } }),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

// Match API
export const matchAPI = {
  getByTournament: (tournamentId, status) => {
    const params = { tournament_id: tournamentId };
    if (status) params.status = status;
    return api.get('/matches', { params });
  },
  getById: (id) => api.get(`/matches/${id}`),
  updateScore: (id, score_team1, score_team2, complete = false) => 
    api.post(`/matches/${id}/score`, { score_team1, score_team2, complete }),
  updateCourt: (id, court) => api.post(`/matches/${id}/court`, { court }),
  updateSchedule: (id, scheduledTime) => api.post(`/matches/${id}/schedule`, { scheduled_time: scheduledTime }),
};

export default api;
