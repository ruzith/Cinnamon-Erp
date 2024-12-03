import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        password: '',
      });
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        role: '',
        password: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await axios.put(`/api/users/${selectedUser._id}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Typography variant="h6">User Management</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Add New User
          </Button>
        </div>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteUser(user._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {selectedUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogContent>
            <TextField
              name="username"
              label="Username"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={handleInputChange}
            />
            <TextField
              name="email"
              label="Email"
              fullWidth
              margin="normal"
              value={formData.email}
              onChange={handleInputChange}
            />
            <TextField
              name="role"
              label="Role"
              fullWidth
              margin="normal"
              value={formData.role}
              onChange={handleInputChange}
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary">
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default UserManagement; 