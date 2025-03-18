import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import Loading from '../../components/common/Loading';
import { tournamentAPI, teamAPI, matchAPI } from '../../api/api';
import moment from 'moment';

const AdminMatchesPage = () => {
  const { tournamentId } = useParams();
  
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Match form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [formData, setFormData] = useState({
    court: '',
    scheduled_time: moment().format('YYYY-MM-DDTHH:mm')
  });

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get tournament details
      const tournamentResponse = await tournamentAPI.getById(tournamentId);
      setTournament(tournamentResponse);
      
      // Get matches
      const matchesResponse = await matchAPI.getByTournament(tournamentId);
      setMatches(Array.isArray(matchesResponse) ? matchesResponse : []);
      
      // Get teams for name lookup
      const teamsResponse = await teamAPI.getByTournament(tournamentId);
      const teamsMap = {};
      if (Array.isArray(teamsResponse)) {
        teamsResponse.forEach(team => {
          teamsMap[team.team_id] = team.team_name;
        });
      }
      setTeams(teamsMap);
      
      setError('');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenEditDialog = (match) => {
    setSelectedMatch(match);
    setFormData({
      court: match.court || '',
      scheduled_time: match.scheduled_time ? 
        moment.unix(match.scheduled_time).format('YYYY-MM-DDTHH:mm') : 
        moment().format('YYYY-MM-DDTHH:mm')
    });
    setIsFormOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    
    if (!selectedMatch) return;
    
    try {
      setLoading(true);
      
      // Update court
      if (formData.court) {
        await matchAPI.updateCourt(selectedMatch.match_id, formData.court);
      }
      
      // Update scheduled time
      if (formData.scheduled_time) {
        const scheduledTime = moment(formData.scheduled_time).unix();
        await matchAPI.updateSchedule(selectedMatch.match_id, scheduledTime);
      }
      
      setIsFormOpen(false);
      
      // Refresh matches list
      await fetchData();
      
    } catch (error) {
      console.error('Failed to update match:', error);
      setError('Failed to update match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get team name from ID
  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD';
    return teams[teamId] || teamId;
  };

  // Filter matches by status based on active tab
  const filteredMatches = () => {
    const statusMap = ['scheduled', 'in_progress', 'completed'];
    const status = statusMap[tabValue];
    
    return matches.filter(match => match.status === status);
  };

  if (loading) {
    return <Loading />;
  }

  if (!tournament) {
    return (
      <Container>
        <Box sx={{ my: 4 }}>
          <Alert severity="error">Tournament not found</Alert>
          <Button 
            component={Link} 
            to="/admin/tournaments" 
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Tournaments
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <div>
            <Typography variant="h4" component="h1">
              {tournament.name} - Matches
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {tournament.status}
            </Typography>
          </div>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              color="primary"
              component={Link}
              to={`/admin/tournaments/${tournamentId}/teams`}
            >
              Manage Teams
            </Button>
            {tournament.status === 'in_progress' && (
              <Button 
                variant="contained" 
                color="secondary"
                component={Link}
                to={`/admin/tournaments/${tournamentId}/scoring`}
              >
                Score Matches
              </Button>
            )}
            <Button 
              component={Link} 
              to={`/tournaments/${tournamentId}/bracket`}
              variant="contained" 
              color="primary"
            >
              View Bracket
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Scheduled" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
          </Tabs>
        </Paper>

        <Paper sx={{ p: 3 }}>
          {filteredMatches().length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Round</strong></TableCell>
                    <TableCell><strong>Teams</strong></TableCell>
                    {tabValue > 0 && <TableCell><strong>Score</strong></TableCell>}
                    <TableCell><strong>Court</strong></TableCell>
                    <TableCell><strong>Scheduled Time</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMatches().map(match => (
                    <TableRow key={match.match_id}>
                      <TableCell>{match.round_number}</TableCell>
                      <TableCell>
                        {getTeamName(match.team1_id)} vs {getTeamName(match.team2_id)}
                      </TableCell>
                      {tabValue > 0 && (
                        <TableCell>
                          <Typography variant="h6" component="div">
                            {match.score_team1} - {match.score_team2}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>{match.court || 'Not assigned'}</TableCell>
                      <TableCell>
                        {match.scheduled_time ? 
                          moment.unix(match.scheduled_time).format('MM/DD/YYYY h:mm A') : 
                          'Not scheduled'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {(match.status === 'scheduled' || match.status === 'in_progress') && (
                            <Button 
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenEditDialog(match)}
                            >
                              Edit
                            </Button>
                          )}
                          {match.status === 'in_progress' && (
                            <Button 
                              size="small"
                              variant="contained"
                              color="secondary"
                              component={Link}
                              to={`/admin/tournaments/${tournamentId}/scoring`}
                              state={{ matchId: match.match_id }}
                            >
                              Score
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1">
                No {tabValue === 0 ? 'scheduled' : tabValue === 1 ? 'in-progress' : 'completed'} matches found.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Edit Match Dialog */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Match Details</DialogTitle>
        <form onSubmit={handleUpdateMatch}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Match: {selectedMatch && `${getTeamName(selectedMatch.team1_id)} vs ${getTeamName(selectedMatch.team2_id)}`}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  id="court"
                  name="court"
                  label="Court"
                  type="text"
                  fullWidth
                  value={formData.court}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  id="scheduled_time"
                  name="scheduled_time"
                  label="Scheduled Time"
                  type="datetime-local"
                  fullWidth
                  value={formData.scheduled_time}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" variant="contained">
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminMatchesPage;
