import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Stack
} from '@mui/material';
import moment from 'moment';
import { tournamentAPI, locationAPI } from '../../api';
import Loading from '../../components/common/Loading';

const AdminTournamentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New tournament form state
  const [isFormOpen, setIsFormOpen] = useState(location?.state?.createNew || false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    location_id: '',
    start_date: moment().format('YYYY-MM-DD'),
    end_date: moment().add(1, 'days').format('YYYY-MM-DD'),
    type: 'single_elimination'
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tournaments = await tournamentAPI.getAllTournaments();
      setTournaments(tournaments);

      // Fetch locations
      const locations = await locationAPI.getAllLocations();
      setLocations(locations);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
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

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Convert dates to Unix timestamps
      const data = {
        name: formData.name,
        location: formData.location, // Legacy field
        location_id: formData.location_id, // New field with location ID
        start_date: moment(formData.start_date).unix(),
        end_date: formData.end_date ? moment(formData.end_date).unix() : null,
        type: formData.type
      };
      
      await tournamentAPI.createTournament(data);
      fetchData();
      
      // Reset form and close dialog
      setFormData({
        name: '',
        location: '',
        location_id: '',
        start_date: moment().format('YYYY-MM-DD'),
        end_date: moment().add(1, 'days').format('YYYY-MM-DD'),
        type: 'single_elimination'
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError('Failed to create tournament. Please try again.');
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (tournament) => {
    setTournamentToDelete(tournament);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;
    
    try {
      setLoading(true);
      await tournamentAPI.deleteTournament(tournamentToDelete.tournament_id);
      
      // Refresh tournaments list
      await fetchData();
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setTournamentToDelete(null);
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      setError('Failed to delete tournament. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (tournamentId, newStatus) => {
    try {
      setLoading(true);
      await tournamentAPI.updateTournament(tournamentId, { status: newStatus });
      
      // Refresh tournaments list
      await fetchData();
    } catch (error) {
      console.error('Failed to update tournament status:', error);
      setError('Failed to update tournament status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Tournaments Management
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setIsFormOpen(true)}
          >
            Create Tournament
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          {tournaments.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                    <TableCell><strong>Dates</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tournaments.map(tournament => (
                    <TableRow key={tournament.tournament_id}>
                      <TableCell>{tournament.name}</TableCell>
                      <TableCell>{tournament.location || 'N/A'}</TableCell>
                      <TableCell>
                        {moment.unix(tournament.start_date).format('MM/DD/YYYY')}
                        {tournament.end_date && ` - ${moment.unix(tournament.end_date).format('MM/DD/YYYY')}`}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tournament.status} 
                          color={
                            tournament.status === 'upcoming' ? 'primary' : 
                            tournament.status === 'in_progress' ? 'success' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{tournament.type.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button 
                            size="small" 
                            component={Link} 
                            to={`/admin/tournaments/${tournament.tournament_id}/teams`}
                          >
                            Teams
                          </Button>
                          <Button 
                            size="small" 
                            component={Link} 
                            to={`/admin/tournaments/${tournament.tournament_id}/pools`}
                          >
                            Pools
                          </Button>
                          <Button 
                            size="small" 
                            component={Link} 
                            to={`/admin/tournaments/${tournament.tournament_id}/matches`}
                          >
                            Matches
                          </Button>
                          {tournament.status === 'upcoming' && (
                            <Button 
                              size="small" 
                              color="success"
                              onClick={() => handleUpdateStatus(tournament.tournament_id, 'in_progress')}
                            >
                              Start
                            </Button>
                          )}
                          {tournament.status === 'in_progress' && (
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => handleUpdateStatus(tournament.tournament_id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          <Button 
                            size="small" 
                            color="error"
                            onClick={() => handleOpenDeleteDialog(tournament)}
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
            <Typography>No tournaments found. Create one to get started!</Typography>
          )}
        </Paper>
      </Box>

      {/* Create Tournament Dialog */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Tournament</DialogTitle>
        <form onSubmit={handleCreateTournament}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  margin="dense"
                  id="name"
                  name="name"
                  label="Tournament Name"
                  type="text"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="location-id-label">Gym Location</InputLabel>
                  <Select
                    labelId="location-id-label"
                    id="location_id"
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleInputChange}
                    label="Gym Location"
                  >
                    <MenuItem value="">-- Select a Location --</MenuItem>
                    {locations.map(loc => (
                      <MenuItem key={loc.location_id} value={loc.location_id}>
                        {loc.name} ({loc.courts} courts)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  id="location"
                  name="location"
                  label="Location Name (Legacy)"
                  type="text"
                  fullWidth
                  value={formData.location}
                  onChange={handleInputChange}
                  helperText="Optional text description of location"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  id="start_date"
                  name="start_date"
                  label="Start Date"
                  type="date"
                  fullWidth
                  required
                  value={formData.start_date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  id="end_date"
                  name="end_date"
                  label="End Date"
                  type="date"
                  fullWidth
                  value={formData.end_date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="tournament-type-label">Tournament Type</InputLabel>
                  <Select
                    labelId="tournament-type-label"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    label="Tournament Type"
                  >
                    <MenuItem value="single_elimination">Single Elimination</MenuItem>
                    <MenuItem value="double_elimination" disabled>Double Elimination (Coming Soon)</MenuItem>
                    <MenuItem value="round_robin" disabled>Round Robin (Coming Soon)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" color="primary" variant="contained">
              Create
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
            Are you sure you want to delete the tournament "{tournamentToDelete?.name}"? 
            This action cannot be undone and will remove all related teams and matches.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTournament} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTournamentsPage;
