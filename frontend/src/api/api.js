import axios from 'axios';

// Base API URL from environment variable or default to localhost
const baseURL = process.env.REACT_APP_API_URL || '/api';

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
  response => response.data,  // Return just the data from successful responses
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
  login: (data) => api.post('/admin/login', data),
  validate: (token) => api.post('/admin/validate', { token }),
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
  createPools: (id) => api.post(`/tournaments/${id}/pools`),
  getPools: (id) => api.get(`/tournaments/${id}/pools`),
  getPoolRankings: (id) => api.get(`/tournaments/${id}/rankings`),
  completePoolPlay: (id) => api.post(`/tournaments/${id}/complete-pool-play`),
  createBracketFromPools: (id, bracketSize) => api.post(`/tournaments/${id}/create-bracket-from-pools`, { bracket_size: bracketSize }),
  getMatches: (id) => api.get('/matches', { params: { tournament_id: id } }),
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
  updateScore: (id, scores_team1, scores_team2, complete = false) => 
    api.post(`/matches/${id}/score`, { scores_team1, scores_team2, complete }),
  updateCourt: (id, court) => api.post(`/matches/${id}/court`, { court }),
  updateSchedule: (id, scheduledTime) => api.post(`/matches/${id}/schedule`, { scheduled_time: scheduledTime }),
};

// Pool API
export const poolAPI = {
  getById: (id) => api.get(`/pools/${id}`),
  getMatches: (id) => api.get(`/pools/${id}/matches`),
  getRankings: (id) => api.get(`/pools/${id}/rankings`),
  updateTeams: (id, teamIds) => api.put(`/pools/${id}/teams`, { team_ids: teamIds }),
  generateSchedule: (id) => api.post(`/pools/${id}/schedule`),
  initializeStandings: (id) => api.post(`/pools/${id}/initialize-standings`),
};

// Pool Match API
export const poolMatchAPI = {
  getById: (id) => api.get(`/pool-matches/${id}`),
  updateScore: (id, setNumber, team1Score, team2Score) => 
    api.put(`/pool-matches/${id}/score`, { set_number: setNumber, team1_score: team1Score, team2_score: team2Score }),
  updateSchedule: (id, data) => api.put(`/pool-matches/${id}/schedule`, data),
};

// Location API
export const locationAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

export default api;