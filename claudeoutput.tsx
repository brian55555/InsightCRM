// Admin Panel Components

// Admin Panel Main Component (pages/admin/AdminPanel.js)
import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import UserManagement from './UserManagement';
import DriveIntegration from './DriveIntegration';
import SystemLogs from './SystemLogs';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [value, setValue] = React.useState(0);
  
  const handleChange = (event, newValue) => {
    setValue(newValue);
    
    switch (newValue) {
      case 0:
        navigate('/admin/users');
        break;
      case 1:
        navigate('/admin/drive');
        break;
      case 2:
        navigate('/admin/logs');
        break;
      default:
        navigate('/admin/users');
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Admin Panel
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="User Management" />
          <Tab label="Google Drive Integration" />
          <Tab label="System Logs" />
        </Tabs>
      </Paper>
      
      <Routes>
        <Route path="/" element={<UserManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/drive" element={<DriveIntegration />} />
        <Route path="/logs" element={<SystemLogs />} />
      </Routes>
    </Box>
  );
}

// User Management Component (pages/admin/UserManagement.js)
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';
import supabase from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditDialogOpen = (user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };
  
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };
  
  const handleDeleteDialogOpen = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({
      ...selectedUser,
      [name]: value,
    });
  };
  
  const saveSettings = async () => {
    try {
      setSaveInProgress(true);
      
      // Update settings in the database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'google_drive_settings',
          value: settings,
          updated_by: user.id,
          updated_at: new Date(),
        });
      
      if (error) throw error;
      
      // Log the change
      await supabase.from('change_logs').insert([
        {
          table_name: 'system_settings',
          record_id: 'google_drive_settings',
          field_name: 'value',
          old_value: JSON.stringify({ ...settings, client_secret: '[REDACTED]' }),
          new_value: JSON.stringify({ ...settings, client_secret: '[REDACTED]' }),
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);
      
      // Update UI state
      setSettings({
        ...settings,
        is_configured: true,
      });
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error saving Google Drive settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaveInProgress(false);
    }
  };
  
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      
      // In a real implementation, you would test the connection to Google Drive
      // This is a mock implementation that simulates a successful test
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set connection status based on whether all required fields are filled
      if (
        settings.client_id &&
        settings.client_secret &&
        settings.refresh_token &&
        settings.root_folder_id
      ) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Error testing Google Drive connection:', error);
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Google Drive Integration
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Connection Status
        </Typography>
        
        <Box display="flex" alignItems="center" mb={2}>
          {connectionStatus === 'connected' ? (
            <>
              <CloudDoneIcon color="success" sx={{ mr: 1 }} />
              <Typography color="success.main">
                Connected to Google Drive
              </Typography>
            </>
          ) : connectionStatus === 'error' ? (
            <>
              <CloudOffIcon color="error" sx={{ mr: 1 }} />
              <Typography color="error">
                Connection error. Please check your credentials.
              </Typography>
            </>
          ) : (
            <>
              <CloudUploadIcon color="warning" sx={{ mr: 1 }} />
              <Typography color="warning.main">
                Not configured yet
              </Typography>
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={testConnection}
            disabled={testingConnection}
            sx={{ ml: 'auto' }}
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </Button>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          To integrate with Google Drive, you need to create a project in the Google Cloud Console, 
          enable the Google Drive API, and create OAuth credentials. Please refer to the 
          <a 
            href="https://developers.google.com/drive/api/v3/quickstart/nodejs" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 4 }}
          >
            Google Drive API documentation
          </a> for more details.
        </Alert>
        
        <Divider sx={{ my: 3 }} />
        
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="client_id"
            label="OAuth Client ID"
            value={settings.client_id || ''}
            onChange={handleInputChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="client_secret"
            label="OAuth Client Secret"
            type="password"
            value={settings.client_secret || ''}
            onChange={handleInputChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="refresh_token"
            label="Refresh Token"
            value={settings.refresh_token || ''}
            onChange={handleInputChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="root_folder_id"
            label="Root Folder ID"
            helperText="The ID of the Google Drive folder where all documents will be stored"
            value={settings.root_folder_id || ''}
            onChange={handleInputChange}
          />
          
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={saveInProgress}
            sx={{ mt: 3 }}
          >
            {saveInProgress ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

// System Logs Component (pages/admin/SystemLogs.js)
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/lab';
import { format } from 'date-fns';
import supabase from '../../supabase';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    table_name: '',
    user_id: '',
    date_from: null,
    date_to: null,
  });
  
  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, [page, rowsPerPage, filters]);
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Build the query
      let query = supabase
        .from('change_logs')
        .select(`
          *,
          users:changed_by (id, email, full_name)
        `, { count: 'exact' });
      
      // Add filters
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      
      if (filters.user_id) {
        query = query.eq('changed_by', filters.user_id);
      }
      
      if (filters.date_from) {
        query = query.gte('changed_at', filters.date_from.toISOString());
      }
      
      if (filters.date_to) {
        // Add one day to include the entire day
        const endDate = new Date(filters.date_to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('changed_at', endDate.toISOString());
      }
      
      // Add pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;
      
      // Execute query
      const { data, count, error } = await query
        .order('changed_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .order('full_name');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
    setPage(0); // Reset to first page when filters change
  };
  
  const handleResetFilters = () => {
    setFilters({
      table_name: '',
      user_id: '',
      date_from: null,
      date_to: null,
    });
    setPage(0);
  };
  
  const handleDetailsDialogOpen = (log) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };
  
  const handleDetailsDialogClose = () => {
    setDetailsDialogOpen(false);
  };
  
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'None';
    }
    
    try {
      // Check if it's a JSON string
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Not a JSON string, return as is
      return value;
    }
  };
  
  const getTableOptions = () => {
    const tables = [...new Set(logs.map(log => log.table_name))];
    return ['businesses', 'contacts', 'tasks', 'documents', 'notes', 'users', 'system_settings', ...tables].filter(Boolean);
  };
  
  const getDisplayName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? (user.full_name || user.email) : userId;
  };
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        System Logs
      </Typography>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Table</InputLabel>
              <Select
                value={filters.table_name}
                label="Table"
                onChange={(e) => handleFilterChange('table_name', e.target.value)}
              >
                <MenuItem value="">All Tables</MenuItem>
                {getTableOptions().map((table) => (
                  <MenuItem key={table} value={table}>
                    {table}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>User</InputLabel>
              <Select
                value={filters.user_id}
                label="User"
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
              >
                <MenuItem value="">All Users</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="From Date"
              value={filters.date_from}
              onChange={(date) => handleFilterChange('date_from', date)}
              renderInput={(params) => <TextField size="small" {...params} />}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="To Date"
              value={filters.date_to}
              onChange={(date) => handleFilterChange('date_to', date)}
              renderInput={(params) => <TextField size="small" {...params} />}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined"
              onClick={handleResetFilters}
              fullWidth
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Logs Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date & Time</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    {format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>{log.table_name}</TableCell>
                  <TableCell>
                    {log.field_name === 'creation'
                      ? 'Created'
                      : log.field_name === 'deletion'
                      ? 'Deleted'
                      : 'Updated'}
                  </TableCell>
                  <TableCell>
                    {log.users ? (log.users.full_name || log.users.email) : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDetailsDialogOpen(log)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Log Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleDetailsDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Date & Time"
                      secondary={format(new Date(selectedLog.changed_at), 'yyyy-MM-dd HH:mm:ss')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Table"
                      secondary={selectedLog.table_name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Record ID"
                      secondary={selectedLog.record_id}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Action"
                      secondary={
                        selectedLog.field_name === 'creation'
                          ? 'Record Created'
                          : selectedLog.field_name === 'deletion'
                          ? 'Record Deleted'
                          : `Field Updated: ${selectedLog.field_name}`
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="User"
                      secondary={
                        selectedLog.users
                          ? `${selectedLog.users.full_name || 'Unknown'} (${
                              selectedLog.users.email || selectedLog.changed_by
                            })`
                          : selectedLog.changed_by
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Change Details
                </Typography>
                
                {selectedLog.old_value && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Old Value:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatValue(selectedLog.old_value)}
                    </Paper>
                  </Box>
                )}
                
                {selectedLog.new_value && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      New Value:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatValue(selectedLog.new_value)}
                    </Paper>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
},
    });
  };
  
  const toggleApproval = async (userId, currentStatus) => {
    try {
      // Get the user being updated
      const userToUpdate = users.find(u => u.id === userId);
      
      // Update the user's approval status
      const { error } = await supabase
        .from('users')
        .update({ approved: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the change
      await supabase.from('change_logs').insert([
        {
          table_name: 'users',
          record_id: userId,
          field_name: 'approved',
          old_value: currentStatus.toString(),
          new_value: (!currentStatus).toString(),
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, approved: !currentStatus } : u));
    } catch (error) {
      console.error('Error toggling approval status:', error);
      alert('Error updating user. Please try again.');
    }
  };
  
  const handleUpdateUser = async () => {
    try {
      if (!selectedUser) return;
      
      // Store original user for logging
      const originalUser = users.find(u => u.id === selectedUser.id);
      
      // Update the user
      const { error } = await supabase
        .from('users')
        .update({
          full_name: selectedUser.full_name,
          role: selectedUser.role,
          approved: selectedUser.approved,
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      // Log the change
      await supabase.from('change_logs').insert([
        {
          table_name: 'users',
          record_id: selectedUser.id,
          field_name: 'multiple fields',
          old_value: JSON.stringify({
            full_name: originalUser.full_name,
            role: originalUser.role,
            approved: originalUser.approved,
          }),
          new_value: JSON.stringify({
            full_name: selectedUser.full_name,
            role: selectedUser.role,
            approved: selectedUser.approved,
          }),
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);
      
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
      handleEditDialogClose();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };
  
  const handleDeleteUser = async () => {
    try {
      if (!selectedUser) return;
      
      // Cannot delete your own account
      if (selectedUser.id === user.id) {
        alert('You cannot delete your own account.');
        return;
      }
      
      // Delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      // Log the deletion
      await supabase.from('change_logs').insert([
        {
          table_name: 'users',
          record_id: selectedUser.id,
          field_name: 'deletion',
          old_value: JSON.stringify(selectedUser),
          new_value: null,
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);
      
      // Update local state
      setUsers(users.filter(u => u.id !== selectedUser.id));
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        User Management
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.full_name || 'N/A'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role || 'user'}
                      color={u.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.approved ? 'Approved' : 'Pending'}
                      color={u.approved ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {u.last_login ? format(new Date(u.last_login), 'MMM d, yyyy') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={u.approved ? 'Revoke Access' : 'Approve User'}>
                      <IconButton
                        size="small"
                        color={u.approved ? 'error' : 'success'}
                        onClick={() => toggleApproval(u.id, u.approved)}
                      >
                        {u.approved ? <CancelIcon /> : <CheckCircleIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit User">
                      <IconButton
                        size="small"
                        onClick={() => handleEditDialogOpen(u)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDialogOpen(u)}
                        disabled={u.id === user.id} // Cannot delete your own account
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                name="email"
                label="Email"
                value={selectedUser.email}
                disabled
              />
              
              <TextField
                margin="normal"
                fullWidth
                name="full_name"
                label="Full Name"
                value={selectedUser.full_name || ''}
                onChange={handleInputChange}
              />
              
              <TextField
                margin="normal"
                select
                fullWidth
                name="role"
                label="Role"
                value={selectedUser.role || 'user'}
                onChange={handleInputChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              
              <TextField
                margin="normal"
                select
                fullWidth
                name="approved"
                label="Status"
                value={selectedUser.approved ? true : false}
                onChange={handleInputChange}
              >
                <MenuItem value={true}>Approved</MenuItem>
                <MenuItem value={false}>Pending</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography>
              Are you sure you want to delete the user {selectedUser.email}? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Google Drive Integration Component (pages/admin/DriveIntegration.js)
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import supabase from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function DriveIntegration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [settings, setSettings] = useState({
    client_id: '',
    client_secret: '',
    refresh_token: '',
    root_folder_id: '',
    is_configured: false,
  });
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would fetch the settings from the database
      // This is a mock implementation
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'google_drive_settings')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found, initialize with empty settings
          setSettings({
            client_id: '',
            client_secret: '',
            refresh_token: '',
            root_folder_id: '',
            is_configured: false,
          });
        } else {
          throw error;
        }
      } else if (data) {
        setSettings(data.value || {});
        setConnectionStatus(data.value.is_configured ? 'connected' : null);
      }
    } catch (error) {
      console.error('Error fetching Google Drive settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value// Notes Components

// Notes List Component (pages/notes/NotesList.js)
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReactQuill from 'quill';
import 'quill/dist/quill.snow.css';
import { format } from 'date-fns';
import supabase from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

// Note categories
const NOTE_CATEGORIES = [
  'General',
  'Meeting',
  'Call',
  'Email',
  'Task',
  'Idea',
  'Issue',
  'Other',
];

export default function NotesList({ businessId }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorRef, setEditorRef] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    title: '',
    content: '',
    category: 'General',
    business_id: businessId || '',
  });
  
  useEffect(() => {
    fetchNotes();
    if (!businessId) {
      fetchBusinesses();
    }
  }, [businessId]);
  
  useEffect(() => {
    if (dialogOpen && !editorRef) {
      const quill = new ReactQuill('#editor-container', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
          ],
        },
      });
      
      if (currentNote.content) {
        quill.clipboard.dangerouslyPasteHTML(currentNote.content);
      }
      
      setEditorRef(quill);
    }
  }, [dialogOpen, currentNote]);
  
  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('notes')
        .select(`
          *,
          businesses:business_id (id, name),
          users:created_by (id, email, full_name)
        `);
      
      if (businessId) {
        query = query.eq('business_id', businessId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };
  
  const handleMenuOpen = (event, note) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNote(note);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleDialogOpen = (note = null) => {
    if (note) {
      setCurrentNote({
        ...note,
        content: note.content,
      });
    } else {
      setCurrentNote({
        title: '',
        content: '',
        category: 'General',
        business_id: businessId || '',
      });
    }
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditorRef(null);
  };
  
  const handleDeleteDialogOpen = (note) => {
    setSelectedNote(note);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleViewDialogOpen = (note) => {
    setSelectedNote(note);
    setViewDialogOpen(true);
  };
  
  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentNote({
      ...currentNote,
      [name]: value,
    });
  };
  
  const handleSubmit = async () => {
    try {
      if (!currentNote.title || !currentNote.business_id) {
        alert('Title and business are required fields');
        return;
      }
      
      const content = editorRef ? editorRef.root.innerHTML : currentNote.content;
      
      const isEditing = !!currentNote.id;
      
      if (isEditing) {
        // Log old values before updating
        const oldNote = notes.find(n => n.id === currentNote.id);
        
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({
            title: currentNote.title,
            content: content,
            category: currentNote.category,
            business_id: currentNote.business_id,
            updated_at: new Date(),
          })
          .eq('id', currentNote.id);
        
        if (error) throw error;
        
        // Log the change
        await supabase.from('change_logs').insert([
          {
            table_name: 'notes',
            record_id: currentNote.id,
            field_name: 'multiple fields',
            old_value: JSON.stringify(oldNote),
            new_value: JSON.stringify({
              ...currentNote,
              content,
            }),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert([
            {
              title: currentNote.title,
              content: content,
              category: currentNote.category,
              business_id: currentNote.business_id,
              created_by: user.id,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ])
          .select();
        
        if (error) throw error;
        
        // Log the creation
        if (data && data[0]) {
          await supabase.from('change_logs').insert([
            {
              table_name: 'notes',
              record_id: data[0].id,
              field_name: 'creation',
              old_value: null,
              new_value: JSON.stringify(data[0]),
              changed_by: user.id,
              changed_at: new Date(),
            },
          ]);
        }
      }
      
      // Refresh notes
      fetchNotes();
      handleDialogClose();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note. Please try again.');
    }
  };
  
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', selectedNote.id);
      
      if (error) throw error;
      
      // Log the deletion
      await supabase.from('change_logs').insert([
        {
          table_name: 'notes',
          record_id: selectedNote.id,
          field_name: 'deletion',
          old_value: JSON.stringify(selectedNote),
          new_value: null,
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);
      
      setNotes(notes.filter(n => n.id !== selectedNote.id));
      handleDeleteDialogClose();
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note. Please try again.');
    }
  };
  
  // Function to strip HTML tags for preview
  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };
  
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">
          {businessId ? 'Business Notes' : 'All Notes'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add Note
        </Button>
      </Box>
      
      {loading ? (
        <Typography>Loading notes...</Typography>
      ) : notes.length === 0 ? (
        <Typography>No notes found</Typography>
      ) : (
        <Grid container spacing={3}>
          {notes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={note.title}
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={note.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(note.created_at), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  }
                  action={
                    <IconButton
                      aria-label="note actions"
                      onClick={(e) => handleMenuOpen(e, note)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stripHtml(note.content).length > 150
                      ? `${stripHtml(note.content).substring(0, 150)}...`
                      : stripHtml(note.content)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleViewDialogOpen(note)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => handleDialogOpen(note)}
                  >
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Note Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedNote) handleViewDialogOpen(selectedNote);
        }}>
          View
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedNote) handleDialogOpen(selectedNote);
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedNote) handleDeleteDialogOpen(selectedNote);
        }}>
          Delete
        </MenuItem>
      </Menu>
      
      {/* Add/Edit Note Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentNote.id ? 'Edit Note' : 'Add New Note'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="title"
              label="Note Title"
              value={currentNote.title}
              onChange={handleInputChange}
            />
            
            <TextField
              margin="normal"
              select
              fullWidth
              name="category"
              label="Category"
              value={currentNote.category}
              onChange={handleInputChange}
            >
              {NOTE_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            
            {!businessId && (
              <TextField
                margin="normal"
                required
                select
                fullWidth
                name="business_id"
                label="Business"
                value={currentNote.business_id}
                onChange={handleInputChange}
              >
                {businesses.map((business) => (
                  <MenuItem key={business.id} value={business.id}>
                    {business.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Note Content
            </Typography>
            
            <Box
              id="editor-container"
              sx={{
                height: 300,
                mb: 2,
                '& .ql-editor': {
                  minHeight: 200,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentNote.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Note Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleViewDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedNote?.title}
          <IconButton
            aria-label="close"
            onClick={handleViewDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            &times;
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedNote && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip label={selectedNote.category} color="primary" />
                {!businessId && selectedNote.businesses && (
                  <Typography variant="body2" color="text.secondary">
                    Business: {selectedNote.businesses.name}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Created: {format(new Date(selectedNote.created_at), 'MMM d, yyyy')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  By: {selectedNote.users?.full_name || selectedNote.users?.email || 'Unknown'}
                </Typography>
              </Box>
              
              <Box
                dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                sx={{
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                  '& pre': {
                    backgroundColor: '#f5f5f5',
                    padding: 2,
                    borderRadius: 1,
                    overflowX: 'auto',
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #ccc',
                    paddingLeft: 2,
                    margin: 0,
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              handleViewDialogClose();
              if (selectedNote) handleDialogOpen(selectedNote);
            }}
            color="primary"
          >
            Edit
          </Button>
          <Button onClick={handleViewDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this note? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Main Notes Page (pages/notes/Notes.js)
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NotesList from './NotesList';

export default function Notes() {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Notes
      </Typography>
      
      <NotesList />
    </Box>
  );// Documents Components

// Documents List Component (pages/documents/DocumentsList.js)
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Menu from '@mui/material/Menu';
import CircularProgress from '@mui/material/CircularProgress';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Document, Page } from 'react-pdf';
import Dropzone from 'react-dropzone';
import { format } from 'date-fns';
import supabase from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

// Document categories
const DOCUMENT_CATEGORIES = [
  'Contract',
  'Agreement',
  'Proposal',
  'Report',
  'Presentation',
  'Financial',
  'Legal',
  'Other',
];

export default function DocumentsList({ businessId }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');
  const [pathHistory, setPathHistory] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [folderName, setFolderName] = useState('');
  
  // Upload form state
  const [uploadData, setUploadData] = useState({
    name: '',
    description: '',
    category: '',
    business_id: businessId || '',
    file: null,
  });
  
  useEffect(() => {
    fetchDocuments();
    if (!businessId) {
      fetchBusinesses();
    }
  }, [businessId, currentPath]);
  
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // This is a mock implementation for the document hierarchy
      // In a real implementation, you would integrate with Google Drive API
      // and manage folder structures appropriately
      
      // For demonstration, we'll simulate folders based on document paths
      let query = supabase
        .from('documents')
        .select(`
          *,
          businesses:business_id (id, name),
          users:created_by (id, email, full_name)
        `);
      
      if (businessId) {
        query = query.eq('business_id', businessId);
      }
      
      // Filter by current path
      if (currentPath === '/') {
        // Only show root level documents
        query = query.or('path.is.null,path.eq./')
      } else {
        // Show documents in the current path
        query = query.eq('path', currentPath);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      // Add simulated folders if there are documents in subdirectories
      const folderPaths = new Set();
      const allDocs = await supabase
        .from('documents')
        .select('path')
        .not('path', 'is', null);
      
      if (!allDocs.error && allDocs.data) {
        allDocs.data.forEach(doc => {
          if (doc.path && doc.path.startsWith(currentPath) && doc.path !== currentPath) {
            // Get the next folder in the path
            const remainingPath = doc.path.slice(currentPath.length);
            const nextFolder = remainingPath.split('/')[1];
            if (nextFolder) {
              folderPaths.add(`${currentPath}${nextFolder}/`);
            }
          }
        });
      }
      
      const folders = Array.from(folderPaths).map(path => {
        const folderName = path.split('/').filter(Boolean).pop();
        return {
          id: `folder-${folderName}`,
          name: folderName,
          type: 'folder',
          path: path,
          isFolder: true,
        };
      });
      
      setDocuments([...folders, ...(data || [])]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };
  
  const navigateToFolder = (path) => {
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(path);
  };
  
  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory.pop();
      setPathHistory([...pathHistory]);
      setCurrentPath(previousPath);
    }
  };
  
  const handleMenuOpen = (event, item) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItem(null);
  };
  
  const handleUploadDialogOpen = () => {
    setUploadData({
      name: '',
      description: '',
      category: '',
      business_id: businessId || '',
      file: null,
    });
    setUploadDialogOpen(true);
  };
  
  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setUploadProgress(0);
  };
  
  const handleCreateFolderDialogOpen = () => {
    setFolderName('');
    setCreateFolderDialogOpen(true);
  };
  
  const handleCreateFolderDialogClose = () => {
    setCreateFolderDialogOpen(false);
  };
  
  const handleDeleteDialogOpen = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handlePreviewDialogOpen = (item) => {
    setSelectedItem(item);
    setPreviewDialogOpen(true);
  };
  
  const handlePreviewDialogClose = () => {
    setPreviewDialogOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData({
      ...uploadData,
      [name]: value,
    });
  };
  
  const handleFolderNameChange = (e) => {
    setFolderName(e.target.value);
  };
  
  const handleFileDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadData({
        ...uploadData,
        file,
        name: file.name,
      });
    }
  };
  
  const getFileTypeIcon = (filename) => {
    if (!filename) return <InsertDriveFileIcon />;
    
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <PictureAsPdfIcon color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon color="primary" />;
      case 'doc':
      case 'docx':
        return <DescriptionIcon color="primary" />;
      case 'xls':
      case 'xlsx':
        return <DescriptionIcon color="success" />;
      case 'ppt':
      case 'pptx':
        return <DescriptionIcon color="warning" />;
      case 'js':
      case 'html':
      case 'css':
      case 'json':
        return <CodeIcon color="secondary" />;
      default:
        return <InsertDriveFileIcon />;
    }
  };
  
  const handleExpandCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };
  
  const uploadFile = async () => {
    try {
      const { file, name, description, category, business_id } = uploadData;
      
      if (!file || !name || !business_id) {
        alert('File name and business are required fields');
        return;
      }
      
      setUploadProgress(10);
      
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documents${currentPath}${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('business-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 50) + 10);
          },
        });
      
      if (uploadError) throw uploadError;
      
      setUploadProgress(70);
      
      // Get the public URL
      const { data } = supabase.storage
        .from('business-documents')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      
      // Create document record in database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([
          {
            name,
            description,
            category,
            business_id,
            type: fileExt,
            path: currentPath,
            google_drive_id: publicUrl, // Using this field to store the Supabase URL
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select();
      
      if (docError) throw docError;
      
      setUploadProgress(90);
      
      // Log the creation
      if (docData && docData[0]) {
        await supabase.from('change_logs').insert([
          {
            table_name: 'documents',
            record_id: docData[0].id,
            field_name: 'creation',
            old_value: null,
            new_value: JSON.stringify(docData[0]),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      }
      
      setUploadProgress(100);
      
      // Refresh documents
      fetchDocuments();
      handleUploadDialogClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
      setUploadProgress(0);
    }
  };
  
  const createFolder = async () => {
    try {
      if (!folderName) {
        alert('Folder name is required');
        return;
      }
      
      // In a real implementation, this would create a folder in Google Drive
      // For our mock implementation, we'll create a document with a special type
      
      const newPath = `${currentPath}${folderName}/`;
      
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            name: folderName,
            type: 'folder',
            path: currentPath,
            business_id: businessId || businesses[0]?.id,
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select();
      
      if (error) throw error;
      
      // Log the creation
      if (data && data[0]) {
        await supabase.from('change_logs').insert([
          {
            table_name: 'documents',
            record_id: data[0].id,
            field_name: 'creation',
            old_value: null,
            new_value: JSON.stringify(data[0]),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      }
      
      // Refresh documents
      fetchDocuments();
      handleCreateFolderDialogClose();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error creating folder. Please try again.');
    }
  };
  
  const deleteDocument = async () => {
    try {
      if (!selectedItem) return;
      
      if (selectedItem.isFolder) {
        // In a real implementation, you would delete the folder and its contents in Google Drive
        // For our mock implementation, we'll just refresh the list
        fetchDocuments();
        handleDeleteDialogClose();
        return;
      }
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      // Log the deletion
      await supabase.from('change_logs').insert([
        {
          table_name: 'documents',
          record_id: selectedItem.id,
          field_name: 'deletion',
          old_value: JSON.stringify(selectedItem),
          new_value: null,
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);
      
      // If there was a file in storage, delete it too
      if (selectedItem.google_drive_id) {
        // Extract the filename from the URL
        const url = new URL(selectedItem.google_drive_id);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        await supabase.storage
          .from('business-documents')
          .remove([`documents${currentPath}${fileName}`]);
      }
      
      // Refresh documents
      fetchDocuments();
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document. Please try again.');
    }
  };
  
  const downloadDocument = (item) => {
    if (item.google_drive_id) {
      window.open(item.google_drive_id, '_blank');
    }
  };
  
  const renderBreadcrumbs = () => {
    if (currentPath === '/') {
      return (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Home
        </Typography>
      );
    }
    
    const parts = currentPath.split('/').filter(Boolean);
    let currentBuildPath = '/';
    
    return (
      <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={navigateBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        
        <Typography
          variant="body2"
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setPathHistory([...pathHistory, currentPath]);
            setCurrentPath('/');
          }}
        >
          Home
        </Typography>
        
        {parts.map((part, index) => {
          currentBuildPath += `${part}/`;
          return (
            <React.Fragment key={index}>
              <Typography variant="body2" sx={{ mx: 0.5 }}>/</Typography>
              <Typography
                variant="body2"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  if (currentBuildPath !== currentPath) {
                    setPathHistory([...pathHistory, currentPath]);
                    setCurrentPath(currentBuildPath);
                  }
                }}
              >
                {part}
              </Typography>
            </React.Fragment>
          );
        })}
      </Box>
    );
  };
  
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">
          {businessId ? 'Business Documents' : 'All Documents'}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CreateNewFolderIcon />}
            onClick={handleCreateFolderDialogOpen}
            sx={{ mr: 1 }}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadDialogOpen}
          >
            Upload
          </Button>
        </Box>
      </Box>
      
      {renderBreadcrumbs()}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            No documents found in this location
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadDialogOpen}
            sx={{ mt: 2 }}
          >
            Upload Document
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {documents.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{
                        cursor: item.isFolder || item.type === 'folder' ? 'pointer' : 'default',
                        width: '100%',
                      }}
                      onClick={() => {
                        if (item.isFolder) {
                          navigateToFolder(item.path);
                        } else if (item.type === 'folder') {
                          navigateToFolder(`${currentPath}${item.name}/`);
                        }
                      }}
                    >
                      <Box mr={1}>
                        {item.isFolder || item.type === 'folder' ? (
                          <FolderIcon color="primary" fontSize="large" />
                        ) : (
                          getFileTypeIcon(item.name)
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" noWrap>
                          {item.name}
                        </Typography>
                        {!item.isFolder && item.type !== 'folder' && item.category && (
                          <Chip
                            label={item.category}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {!item.isFolder && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, item)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
                
                {!item.isFolder && item.type !== 'folder' && (
                  <>
                    <CardActions disableSpacing>
                      <Button
                        size="small"
                        startIcon={<CloudDownloadIcon />}
                        onClick={() => downloadDocument(item)}
                      >
                        Download
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ExpandMoreIcon />}
                        onClick={() => handleExpandCard(item.id)}
                        sx={{
                          transform: expandedCard === item.id ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.3s',
                          ml: 'auto',
                        }}
                      >
                        Details
                      </Button>
                    </CardActions>
                    <Collapse in={expandedCard === item.id} timeout="auto" unmountOnExit>
                      <CardContent>
                        {item.description && (
                          <Typography variant="body2" paragraph>
                            {item.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          Uploaded by: {item.users?.full_name || item.users?.email || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Date: {format(new Date(item.created_at), 'MMM d, yyyy')}
                        </Typography>
                        {!businessId && item.businesses && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Business: {item.businesses.name}
                          </Typography>
                        )}
                      </CardContent>
                    </Collapse>
                  </>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Document action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedItem) handlePreviewDialogOpen(selectedItem);
        }}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Preview" />
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedItem) downloadDocument(selectedItem);
        }}>
          <ListItemIcon>
            <CloudDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedItem) handleDeleteDialogOpen(selectedItem);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
      
      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Dropzone onDrop={handleFileDrop} multiple={false}>
            {({ getRootProps, getInputProps }) => (
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed #cccccc',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 2,
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                <Typography>
                  {uploadData.file
                    ? `Selected: ${uploadData.file.name}`
                    : 'Drag and drop a file here, or click to select a file'}
                </Typography>
              </Box>
            )}
          </Dropzone>
          
          {uploadProgress > 0 && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" gutterBottom>
                Upload Progress: {uploadProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                color="primary"
              />
            </Box>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="name"
            label="Document Name"
            value={uploadData.name}
            onChange={handleInputChange}
          />
          
          <TextField
            margin="normal"
            fullWidth
            name="description"
            label="Description"
            multiline
            rows={3}
            value={uploadData.description || ''}
            onChange={handleInputChange}
          />
          
          <TextField
            margin="normal"
            select
            fullWidth
            name="category"
            label="Category"
            value={uploadData.category || ''}
            onChange={handleInputChange}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {DOCUMENT_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          
          {!businessId && (
            <TextField
              margin="normal"
              required
              select
              fullWidth
              name="business_id"
              label="Business"
              value={uploadData.business_id}
              onChange={handleInputChange}
            >
              {businesses.map((business) => (
                <MenuItem key={business.id} value={business.id}>
                  {business.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button 
            onClick={uploadFile} 
            variant="contained"
            disabled={!uploadData.file || !uploadData.name || uploadProgress > 0}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onClose={handleCreateFolderDialogClose}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            name="folderName"
            label="Folder Name"
            value={folderName}
            onChange={handleFolderNameChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateFolderDialogClose}>Cancel</Button>
          <Button
            onClick={createFolder}
            variant="contained"
            disabled={!folderName}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete {selectedItem?.isFolder ? 'Folder' : 'Document'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedItem?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={deleteDocument} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={handlePreviewDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem?.name}
          <IconButton
            aria-label="close"
            onClick={handlePreviewDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            &times;
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Box sx={{ textAlign: 'center' }}>
              {selectedItem.type === 'pdf' && selectedItem.google_drive_id ? (
                <iframe
                  src={selectedItem.google_drive_id}
                  width="100%"
                  height="500px"
                  title={selectedItem.name}
                  frameBorder="0"
                />
              ) : selectedItem.type && ['jpg', 'jpeg', 'png', 'gif'].includes(selectedItem.type.toLowerCase()) ? (
                <img
                  src={selectedItem.google_drive_id}
                  alt={selectedItem.name}
                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                />
              ) : (
                <Box>
                  <Typography variant="body1">
                    Preview not available for this file type.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => downloadDocument(selectedItem)}
                    sx={{ mt: 2 }}
                  >
                    Download to View
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Main Documents Page (pages/documents/Documents.js)
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DocumentsList from './DocumentsList';

export default function Documents() {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Documents
      </Typography>
      
      <DocumentsList />
    </Box>
  );// CRM Web Application with React JS and Supabase
// Package.json dependencies:
// {
//   "dependencies": {
//     "@emotion/react": "^11.11.0",
//     "@emotion/styled": "^11.11.0",
//     "@mui/icons-material": "^5.11.16",
//     "@mui/lab": "^5.0.0-alpha.129",
//     "@mui/material": "^5.13.0",
//     "@supabase/supabase-js": "^2.21.0",
//     "date-fns": "^2.30.0",
//     "googleapis": "^118.0.0",
//     "quill": "^1.3.7",
//     "quill-image-resize-module": "^3.0.0",
//     "react": "^18.2.0",
//     "react-dom": "^18.2.0",
//     "react-dropzone": "^14.2.3",
//     "react-pdf": "^6.2.2",
//     "react-router-dom": "^6.11.1"
//   }

// Reset Password Page (pages/auth/ResetPassword.js)
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockResetIcon from '@mui/icons-material/LockReset';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../contexts/AuthContext';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      const { error, message } = await resetPassword(email);
      
      if (error) {
        throw new Error(error);
      }
      
      setMessage(message || 'Password reset email sent. Please check your inbox.');
      setEmail('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?technology)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockResetIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Reset Password
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          {message && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {message}
            </Alert>
          )}
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Reset Password
            </Button>
            <Grid container justifyContent="center">
              <Grid item>
                <Link component={RouterLink} to="/login" variant="body2">
                  Back to Sign In
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}

// Pending Approval Page (pages/auth/PendingApproval.js)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useAuth } from '../../contexts/AuthContext';

export default function PendingApproval() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: 'center',
        }}
      >
        <HourglassEmptyIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Account Pending Approval
        </Typography>
        <Typography variant="body1" paragraph>
          Your account has been registered but requires approval from an administrator before you can access the CRM.
        </Typography>
        <Typography variant="body1" paragraph>
          Please contact your administrator for assistance or check back later.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleSignOut}
          sx={{ mt: 2 }}
        >
          Sign Out
        </Button>
      </Paper>
    </Box>
  );
// }

// ======= Main App File (index.js) =======
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// ======= Theme Configuration (theme.js) =======
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0066FF', // Professional blue
    },
    secondary: {
      main: '#2D3748', // Slate
    },
    background: {
      default: '#FFFFFF', // White
      paper: '#F7FAFC', // Light gray for cards
    },
    text: {
      primary: '#1A202C', // Dark text
    },
    success: {
      main: '#4CAF50', // Green
    },
    warning: {
      main: '#FFA500', // Orange
    },
    error: {
      main: '#F44336', // Red
    },
  },
  typography: {
    fontFamily: 'Inter, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
  spacing: 8, // Base spacing unit (8px)
});

export default theme;

// ======= Supabase Client (supabase.js) =======
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hozneawfsiqumrkflrcg.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

// ======= Authentication Context (contexts/AuthContext.js) =======
import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
      } else {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          fetchUserDetails(session.user.id);
        } else {
          setLoading(false);
        }
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          fetchUserDetails(session.user.id);
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserDetails(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, approved')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      setUserRole(data.role);
      setIsApproved(data.approved);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, fullName) {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Create a user record in our users table
      if (user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: fullName,
              role: 'user', // Default role
              approved: false, // Needs admin approval
              created_at: new Date(),
            },
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      return { user, message: 'Registration successful. Please wait for admin approval.' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if user is approved
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('approved, role')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        throw userError;
      }

      if (!userData.approved) {
        // Sign out the user if not approved
        await supabase.auth.signOut();
        throw new Error('Your account is pending approval by an administrator.');
      }

      setUserRole(userData.role);
      setIsApproved(userData.approved);

      // Update last login time
      await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', data.user.id);

      return { user: data.user };
    } catch (error) {
      return { error: error.message };
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }

  async function resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw error;
      }
      
      return { message: 'Password reset email sent.' };
    } catch (error) {
      return { error: error.message };
    }
  }

  const value = {
    user,
    session,
    userRole,
    isApproved,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ======= Main App Component (App.js) =======
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import PendingApproval from './pages/auth/PendingApproval';

// App Pages
import Dashboard from './pages/Dashboard';
import Businesses from './pages/businesses/Businesses';
import BusinessDetail from './pages/businesses/BusinessDetail';
import Contacts from './pages/contacts/Contacts';
import Tasks from './pages/tasks/Tasks';
import Documents from './pages/documents/Documents';
import Notes from './pages/notes/Notes';
import AdminPanel from './pages/admin/AdminPanel';
import Layout from './components/layout/Layout';

function App() {
  const { user, loading, isApproved, userRole } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/pending-approval"
        element={
          user && !isApproved ? <PendingApproval /> : <Navigate to="/" />
        }
      />

      {/* App Routes - Protected by authentication */}
      <Route
        path="/"
        element={
          user ? (
            isApproved ? (
              <Layout />
            ) : (
              <Navigate to="/pending-approval" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="businesses/:id" element={<BusinessDetail />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="documents" element={<Documents />} />
        <Route path="notes" element={<Notes />} />
        
        {/* Admin routes - Protected by role */}
        <Route
          path="admin/*"
          element={
            userRole === 'admin' ? <AdminPanel /> : <Navigate to="/" />
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

// ======= Layout Component (components/layout/Layout.js) =======
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import ContactsIcon from '@mui/icons-material/Contacts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import NoteIcon from '@mui/icons-material/Note';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../supabase';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function Layout() {
  const [open, setOpen] = useState(true);
  const [userMenu, setUserMenu] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch user favorites
    const fetchFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select(`
            id,
            businesses:business_id (
              id,
              name
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        setFavorites(data || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenu(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenu(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    navigate(openTabs[newValue].path);
  };

  const handleTabClose = (event, index) => {
    event.stopPropagation();
    const newTabs = [...openTabs];
    newTabs.splice(index, 1);
    setOpenTabs(newTabs);
    
    // If we're closing the current tab
    if (index === currentTab) {
      // Navigate to the previous tab or to dashboard if no tabs left
      if (newTabs.length > 0) {
        const newIndex = index > 0 ? index - 1 : 0;
        setCurrentTab(newIndex);
        navigate(newTabs[newIndex].path);
      } else {
        setCurrentTab(0);
        navigate('/');
      }
    } else if (index < currentTab) {
      // If we're closing a tab before the current tab, adjust the current tab index
      setCurrentTab(currentTab - 1);
    }
  };

  const openTab = (path, label, id) => {
    // Check if tab already exists
    const existingTabIndex = openTabs.findIndex((tab) => tab.path === path);
    
    if (existingTabIndex !== -1) {
      // Tab already exists, just switch to it
      setCurrentTab(existingTabIndex);
    } else {
      // Add new tab
      setOpenTabs([...openTabs, { path, label, id }]);
      setCurrentTab(openTabs.length);
    }
    
    navigate(path);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Businesses', icon: <BusinessIcon />, path: '/businesses' },
    { text: 'Contacts', icon: <ContactsIcon />, path: '/contacts' },
    { text: 'Tasks', icon: <AssignmentIcon />, path: '/tasks' },
    { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
    { text: 'Notes', icon: <NoteIcon />, path: '/notes' },
  ];

  // Only add Admin Panel for admin users
  if (userRole === 'admin') {
    menuItems.push({ 
      text: 'Admin Panel', 
      icon: <AdminPanelSettingsIcon />, 
      path: '/admin' 
    });
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Business Intelligence CRM
          </Typography>
          
          <Tooltip title="User Account">
            <IconButton 
              color="inherit" 
              onClick={handleUserMenuOpen}
              size="large"
            >
              <Avatar 
                sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}
              >
                {user?.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={userMenu}
            open={Boolean(userMenu)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="body2">
                Role: {userRole || 'User'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
        
        {/* Tabs for open businesses */}
        {openTabs.length > 0 && (
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderBottom: 1,
              borderColor: 'divider' 
            }}
          >
            {openTabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {tab.label}
                    <IconButton
                      size="small"
                      onClick={(e) => handleTabClose(e, index)}
                      sx={{ ml: 1 }}
                    >
                      &times;
                    </IconButton>
                  </Box>
                }
              />
            ))}
          </Tabs>
        )}
      </AppBarStyled>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {favorites.length > 0 && (
          <>
            <Divider />
            <List
              subheader={
                <Typography variant="subtitle2" sx={{ pl: 2, pt: 1 }}>
                  Favorite Businesses
                </Typography>
              }
            >
              {favorites.map((favorite) => (
                <ListItem key={favorite.id} disablePadding>
                  <ListItemButton
                    onClick={() => 
                      openTab(
                        `/businesses/${favorite.businesses.id}`,
                        favorite.businesses.name,
                        favorite.businesses.id
                      )
                    }
                  >
                    <ListItemIcon>
                      <StarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={favorite.businesses.name}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Drawer>
      
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
}

// ======= Auth Pages =======

// Login Page (pages/auth/Login.js)
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?business)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link component={RouterLink} to="/reset-password" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}
