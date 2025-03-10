import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  IconButton,
  Chip,
  Grid,
  Alert,
  Stack,
  DialogContentText,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import Loading from '../../components/common/Loading';
import { tournamentAPI, teamAPI } from '../../api/api';

const AdminTeamsPage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Team form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    team_name: '',
    players: ['', '', '', '', '', ''] // Default 6 players
  });
  
  // Edit team state
  const [editingTeam, setEditingTeam] = useState(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  
  // Create bracket confirmation
  const [bracketDialogOpen, setBracketDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get tournament details
      const tournamentResponse = await tournamentAPI.getById(tournamentId);
      setTournament(tournamentResponse.data);
      
      // Get teams
      const teamsResponse = await teamAPI.getByTournament(tournamentId);
      setTeams(teamsResponse.data);
      
      setError('');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = value;
    setFormData({
      ...formData,
      players: newPlayers
    });
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const payload = {
        team_name: formData.team_name,
        tournament_id: tournamentId,
        players: formData.players.filter(p => p.trim() !== '')
      };
      
      if (editingTeam) {
        // Update existing team
        await teamAPI.update(editingTeam.team_id, payload);
      } else {
        // Create new team
        await teamAPI.create(payload);
      }
      
      setIsFormOpen(false);
      setFormData({
        team_name: '',
        players: ['', '', '', '', '', '']
      });
      setEditingTeam(null);
      
      // Refresh teams list
      await fetchData();
      
    } catch (error) {
      console.error('Failed to save team:', error);
      setError('Failed to save team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (team) => {
    setEditingTeam(team);
    setFormData({
      team_name: team.team_name,
      players: [...team.players, ...Array(6).fill('')].slice(0, 6) // Ensure 6 player fields
    });
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    try {
      setLoading(true);
      await teamAPI.delete(teamToDelete.team_id);
      
      // Refresh teams list
      await fetchData();
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Failed to delete team:', error);
      setError('Failed to delete team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBracket = async () => {
    if (teams.length < 2) {
      setError('You need at least 2 teams to create a bracket.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get team IDs
      const teamIds = teams.map(team => team.team_id);
      
      // Create bracket
      await tournamentAPI.createBracket(tournamentId, teamIds);
      
      // Update tournament status
      await tournamentAPI.update(tournamentId, { status: 'in_progress' });
      
      // Navigate to matches page
      navigate(`/admin/tournaments/${tournamentId}/matches`);
      
    } catch (error) {
      console.error('Failed to create bracket:', error);
      setError('Failed to create bracket. Please try again.');
    } finally {
      setLoading(false);
      setBracketDialogOpen(false);
    }
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
              {tournament.name} - Teams
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
              to={`/admin/tournaments/${tournamentId}/matches`}
            >
              View Matches
            </Button>
            {tournament.status === 'upcoming' && teams.length >= 2 && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setBracketDialogOpen(true)}
              >
                Generate Bracket
              </Button>
            )}
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setFormData({ team_name: '', players: ['', '', '', '', '', ''] });
                setEditingTeam(null);
                setIsFormOpen(true);
              }}
            >
              Add Team
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          {teams.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Team Name</strong></TableCell>
                    <TableCell><strong>Players</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map(team => (
                    <TableRow key={team.team_id}>
                      <TableCell>{team.team_name}</TableCell>
                      <TableCell>
                        {team.players && team.players.length > 0 ? (
                          <List dense>
                            {team.players.map((player, index) => (
                              <ListItem key={index} disableGutters sx={{ py: 0 }}>
                                <ListItemText primary={player} />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          "No players listed"
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button 
                            size="small" 
                            onClick={() => handleOpenEditDialog(team)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            onClick={() => handleOpenDeleteDialog(team)}
                            disabled={tournament.status !== 'upcoming'}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No teams have been added yet. Add teams to create a bracket.</Typography>
          )}
        </Paper>
      </Box>

      {/* Create/Edit Team Dialog */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
        <form onSubmit={handleCreateTeam}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  margin="dense"
                  id="team_name"
                  name="team_name"
                  label="Team Name"
                  type="text"
                  fullWidth
                  required
                  value={formData.team_name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Players</Typography>
                {formData.players.map((player, index) => (
                  <TextField
                    key={index}
                    margin="dense"
                    id={`player-${index}`}
                    label={`Player ${index + 1}`}
                    type="text"
                    fullWidth
                    value={player}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                  />
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" variant="contained">
              {editingTeam ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the team "{teamToDelete?.team_name}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTeam} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Bracket Confirmation */}
      <Dialog
        open={bracketDialogOpen}
        onClose={() => setBracketDialogOpen(false)}
      >
        <DialogTitle>Generate Tournament Bracket</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to generate the bracket for this tournament? 
            This will create the competition structure based on the {teams.length} teams currently registered.
            <br /><br />
            <strong>Important:</strong> You won't be able to add or remove teams after the bracket is created.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBracketDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBracket} color="primary" variant="contained">
            Generate Bracket
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTeamsPage;
