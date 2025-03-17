import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, IconButton, Box, Chip, Breadcrumbs,
  CircularProgress, Alert, Stack
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { locationAPI } from '../../api/api';

const AdminLocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    courts: 1,
    capacity: 0,
    features: ''
  });

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await locationAPI.getAll();
      setLocations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convert numeric inputs
    if (name === 'courts' || name === 'capacity') {
      processedValue = value === '' ? 0 : parseInt(value, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleOpenForm = (location = null) => {
    if (location) {
      // Edit existing location
      setFormData({
        name: location.name,
        address: location.address,
        courts: location.courts,
        capacity: location.capacity,
        features: location.features || ''
      });
      setSelectedLocation(location);
    } else {
      // Create new location
      setFormData({
        name: '',
        address: '',
        courts: 1,
        capacity: 0,
        features: ''
      });
      setSelectedLocation(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedLocation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Extract features as array if provided as comma-separated string
      let processedFeatures = formData.features;
      if (typeof formData.features === 'string' && formData.features.trim()) {
        processedFeatures = formData.features.split(',').map(feature => feature.trim());
      }
      
      const data = {
        ...formData,
        features: processedFeatures
      };
      
      if (selectedLocation) {
        // Update existing location
        await locationAPI.update(selectedLocation.location_id, data);
      } else {
        // Create new location
        await locationAPI.create(data);
      }
      
      fetchLocations();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving location:', err);
      setError('Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (location) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedLocation(null);
  };

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    try {
      await locationAPI.delete(selectedLocation.location_id);
      fetchLocations();
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location. It may be in use by tournaments or matches.');
    } finally {
      setLoading(false);
    }
  };

  // Format features for display
  const formatFeatures = (features) => {
    if (!features || features.length === 0) return 'None';
    
    if (Array.isArray(features)) {
      return (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {features.map((feature, index) => (
            <Chip key={index} label={feature} size="small" />
          ))}
        </Stack>
      );
    }
    
    return features.toString();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link to="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>
            Dashboard
          </Link>
          <Typography color="text.primary">Locations</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Volleyball Locations
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Add Location
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        
        {loading && !isFormOpen && !isDeleteDialogOpen ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                  <TableCell align="center"><strong>Courts</strong></TableCell>
                  <TableCell align="center"><strong>Capacity</strong></TableCell>
                  <TableCell><strong>Features</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ my: 4 }}>
                        No locations found. Add your first volleyball location to get started!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location) => (
                    <TableRow key={location.location_id}>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>{location.address}</TableCell>
                      <TableCell align="center">{location.courts}</TableCell>
                      <TableCell align="center">{location.capacity}</TableCell>
                      <TableCell>{formatFeatures(location.features)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleOpenForm(location)}
                          title="Edit location"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleOpenDeleteDialog(location)}
                          title="Delete location"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      
      {/* Location Form Dialog */}
      <Dialog open={isFormOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedLocation ? 'Edit Location' : 'Add New Location'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  id="name"
                  name="name"
                  label="Location Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="address"
                  name="address"
                  label="Address"
                  fullWidth
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="courts"
                  name="courts"
                  label="Number of Courts"
                  fullWidth
                  type="number"
                  required
                  value={formData.courts}
                  onChange={handleInputChange}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="capacity"
                  name="capacity"
                  label="Capacity (teams)"
                  fullWidth
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="features"
                  name="features"
                  label="Features (comma-separated)"
                  fullWidth
                  value={formData.features}
                  onChange={handleInputChange}
                  helperText="Examples: Parking, Restrooms, Concessions, Showers, Wi-Fi"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm} color="inherit">Cancel</Button>
            <Button type="submit" color="primary" variant="contained">
              {selectedLocation ? 'Update Location' : 'Add Location'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the location "{selectedLocation?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteLocation} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminLocationsPage; 