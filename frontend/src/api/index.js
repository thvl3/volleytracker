import axios from 'axios';

// Set the base URL for the API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add authorization token to all requests
const authToken = localStorage.getItem('token');
if (authToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
}

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/admin/login`, credentials);
    return response.data;
  },
  validateToken: async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/validate-token`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Tournament API
export const tournamentAPI = {
  getAllTournaments: async () => {
    const response = await axios.get(`${API_URL}/tournaments`);
    return response.data;
  },
  getTournament: async (id) => {
    const response = await axios.get(`${API_URL}/tournaments/${id}`);
    return response.data;
  },
  getTournamentBracket: async (id) => {
    const response = await axios.get(`${API_URL}/tournaments/${id}/bracket`);
    return response.data;
  },
  createTournament: async (data) => {
    const response = await axios.post(`${API_URL}/tournaments`, data);
    return response.data;
  },
  updateTournament: async (id, data) => {
    const response = await axios.put(`${API_URL}/tournaments/${id}`, data);
    return response.data;
  },
  deleteTournament: async (id) => {
    const response = await axios.delete(`${API_URL}/tournaments/${id}`);
    return response.data;
  }
};

// Team API
export const teamAPI = {
  getTeamsByTournament: async (tournamentId) => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/teams`);
    return response.data;
  },
  getTeam: async (id) => {
    const response = await axios.get(`${API_URL}/teams/${id}`);
    return response.data;
  },
  createTeam: async (data) => {
    const response = await axios.post(`${API_URL}/teams`, data);
    return response.data;
  },
  updateTeam: async (id, data) => {
    const response = await axios.put(`${API_URL}/teams/${id}`, data);
    return response.data;
  },
  deleteTeam: async (id) => {
    const response = await axios.delete(`${API_URL}/teams/${id}`);
    return response.data;
  }
};

// Match API
export const matchAPI = {
  getMatchesByTournament: async (tournamentId) => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/matches`);
    return response.data;
  },
  getMatch: async (id) => {
    const response = await axios.get(`${API_URL}/matches/${id}`);
    return response.data;
  },
  updateMatchScore: async (id, data) => {
    const response = await axios.put(`${API_URL}/matches/${id}/score`, data);
    return response.data;
  }
};

// Pool API
export const poolAPI = {
  getPoolsByTournament: async (tournamentId) => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/pools`);
    return response.data;
  },
  getPool: async (poolId) => {
    const response = await axios.get(`${API_URL}/pools/${poolId}`);
    return response.data;
  },
  createPool: async (data) => {
    const response = await axios.post(`${API_URL}/pools`, data);
    return response.data;
  },
  updatePoolTeams: async (poolId, data) => {
    const response = await axios.put(`${API_URL}/pools/${poolId}/teams`, data);
    return response.data;
  },
  generateSchedule: async (poolId) => {
    const response = await axios.post(`${API_URL}/pools/${poolId}/schedule`);
    return response.data;
  },
  getPoolRankings: async (poolId) => {
    const response = await axios.get(`${API_URL}/pools/${poolId}/rankings`);
    return response.data;
  },
  createPoolsForTournament: async (tournamentId) => {
    const response = await axios.post(`${API_URL}/tournaments/${tournamentId}/pools`);
    return response.data;
  },
  completePoolPlay: async (tournamentId) => {
    const response = await axios.post(`${API_URL}/tournaments/${tournamentId}/complete-pool-play`);
    return response.data;
  },
  createBracketFromPools: async (tournamentId) => {
    const response = await axios.post(`${API_URL}/tournaments/${tournamentId}/create-bracket-from-pools`);
    return response.data;
  }
};

// Pool Match API
export const poolMatchAPI = {
  getPoolMatches: async (poolId) => {
    const response = await axios.get(`${API_URL}/pools/${poolId}/matches`);
    return response.data;
  },
  getPoolMatch: async (matchId) => {
    const response = await axios.get(`${API_URL}/pool-matches/${matchId}`);
    return response.data;
  },
  updatePoolMatchScore: async (matchId, data) => {
    const response = await axios.put(`${API_URL}/pool-matches/${matchId}/score`, data);
    return response.data;
  }
};

// Location API
export const locationAPI = {
  getAllLocations: async () => {
    const response = await axios.get(`${API_URL}/locations`);
    return response.data;
  },
  getLocation: async (id) => {
    const response = await axios.get(`${API_URL}/locations/${id}`);
    return response.data;
  },
  createLocation: async (data) => {
    const response = await axios.post(`${API_URL}/locations`, data);
    return response.data;
  },
  updateLocation: async (id, data) => {
    const response = await axios.put(`${API_URL}/locations/${id}`, data);
    return response.data;
  },
  deleteLocation: async (id) => {
    const response = await axios.delete(`${API_URL}/locations/${id}`);
    return response.data;
  }
}; 