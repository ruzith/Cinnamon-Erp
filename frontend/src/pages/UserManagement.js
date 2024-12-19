import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    Chip,
    IconButton,
    LinearProgress,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    SupervisorAccount as AdminIcon,
    Security as SecurityIcon,
    Group as GroupIcon,
} from '@mui/icons-material';
import { getUsers, deleteUser, updateUser, createUser } from '../features/users/userSlice';

const UserManagement = () => {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((state) => state.users);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        dispatch(getUsers());
    }, [dispatch]);

    // Calculate summary statistics
    const summaryStats = {
        totalUsers: users.length,
        adminUsers: users.filter(user => user.role === 'admin').length,
        activeUsers: users.filter(user => user.status === 'active').length,
        departments: [...new Set(users.map(user => user.department))].length
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setOpenDialog(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await dispatch(deleteUser(userId));
                dispatch(getUsers());
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const getRoleColor = (role) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'error';
            case 'manager':
                return 'warning';
            case 'accountant':
                return 'info';
            case 'staff':
                return 'success';
            default:
                return 'default';
        }
    };

    const handleSubmit = async () => {
        try {
            const form = document.querySelector('form');
            const formData = new FormData(form);
            
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                role: formData.get('role'),
                status: formData.get('status'),
                department: formData.get('department'),
                ...(selectedUser ? {} : {
                    password: formData.get('password')
                })
            };

            if (selectedUser) {
                await dispatch(updateUser({ id: selectedUser.id, userData }));
            } else {
                await dispatch(createUser(userData));
            }
            
            setOpenDialog(false);
            setSelectedUser(null);
            dispatch(getUsers());
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    if (isLoading) {
        return <LinearProgress />;
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    New User
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            background: (theme) =>
                                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(25, 118, 210, 0.05) 100%)`,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <GroupIcon sx={{ color: 'primary.main', mr: 1 }} />
                            <Typography color="textSecondary">Total Users</Typography>
                        </Box>
                        <Typography variant="h4">{summaryStats.totalUsers}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            background: (theme) =>
                                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(211, 47, 47, 0.05) 100%)`,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AdminIcon sx={{ color: 'error.main', mr: 1 }} />
                            <Typography color="textSecondary">Administrators</Typography>
                        </Box>
                        <Typography variant="h4">{summaryStats.adminUsers}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            background: (theme) =>
                                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(46, 125, 50, 0.05) 100%)`,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <PersonIcon sx={{ color: 'success.main', mr: 1 }} />
                            <Typography color="textSecondary">Active Users</Typography>
                        </Box>
                        <Typography variant="h4">{summaryStats.activeUsers}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            background: (theme) =>
                                `linear-gradient(45deg, ${theme.palette.background.paper} 0%, rgba(251, 140, 0, 0.05) 100%)`,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <SecurityIcon sx={{ color: 'warning.main', mr: 1 }} />
                            <Typography color="textSecondary">Departments</Typography>
                        </Box>
                        <Typography variant="h4">{summaryStats.departments}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Users Table */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Full Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.department}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            color={getRoleColor(user.role)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.status}
                                            color={user.status === 'active' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(user)}
                                            sx={{ color: 'primary.main' }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(user.id)}
                                            sx={{ color: 'error.main', ml: 1 }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* User Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => {
                    setOpenDialog(false);
                    setSelectedUser(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {selectedUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent>
                    <form id="userForm">
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="name"
                                    defaultValue={selectedUser?.name}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    defaultValue={selectedUser?.email}
                                    required
                                />
                            </Grid>
                            {/* Add password field only for new user creation */}
                            {!selectedUser && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        name="password"
                                        type="password"
                                        required
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        label="Role"
                                        name="role"
                                        defaultValue={selectedUser?.role || 'staff'}
                                    >
                                        <MenuItem value="admin">Administrator</MenuItem>
                                        <MenuItem value="staff">Staff</MenuItem>
                                        <MenuItem value="accountant">Accountant</MenuItem>
                                        <MenuItem value="manager">Manager</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        label="Status"
                                        name="status"
                                        defaultValue={selectedUser?.status || 'active'}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Department"
                                    name="department"
                                    defaultValue={selectedUser?.department || ''}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleSubmit}
                    >
                        {selectedUser ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement; 