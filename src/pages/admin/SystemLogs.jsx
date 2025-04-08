// System Logs Component (pages/admin/SystemLogs.jsx)
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import supabase from "../../supabase";

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
    table_name: "",
    user_id: "",
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
      let query = supabase.from("change_logs").select(
        `
          *,
          users:changed_by (id, email, full_name)
        `,
        { count: "exact" },
      );

      // Add filters
      if (filters.table_name) {
        query = query.eq("table_name", filters.table_name);
      }

      if (filters.user_id) {
        query = query.eq("changed_by", filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte("changed_at", filters.date_from.toISOString());
      }

      if (filters.date_to) {
        // Add one day to include the entire day
        const endDate = new Date(filters.date_to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt("changed_at", endDate.toISOString());
      }

      // Add pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      // Execute query
      const { data, count, error } = await query
        .order("changed_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name")
        .order("full_name");

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
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
      table_name: "",
      user_id: "",
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
      return "None";
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
    const tables = [...new Set(logs.map((log) => log.table_name))];
    return [
      "businesses",
      "contacts",
      "tasks",
      "documents",
      "notes",
      "users",
      "system_settings",
      ...tables,
    ].filter(Boolean);
  };

  const getDisplayName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.full_name || user.email : userId;
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
                onChange={(e) =>
                  handleFilterChange("table_name", e.target.value)
                }
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
                onChange={(e) => handleFilterChange("user_id", e.target.value)}
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
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={filters.date_from}
                onChange={(date) => handleFilterChange("date_from", date)}
                slotProps={{
                  textField: {
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="To Date"
                value={filters.date_to}
                onChange={(date) => handleFilterChange("date_to", date)}
                slotProps={{
                  textField: {
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button variant="outlined" onClick={handleResetFilters} fullWidth>
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
                    {format(new Date(log.changed_at), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell>{log.table_name}</TableCell>
                  <TableCell>
                    {log.field_name === "creation"
                      ? "Created"
                      : log.field_name === "deletion"
                        ? "Deleted"
                        : "Updated"}
                  </TableCell>
                  <TableCell>
                    {log.users
                      ? log.users.full_name || log.users.email
                      : "Unknown"}
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
      <Dialog
        open={detailsDialogOpen}
        onClose={handleDetailsDialogClose}
        maxWidth="md"
        fullWidth
      >
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
                      secondary={format(
                        new Date(selectedLog.changed_at),
                        "yyyy-MM-dd HH:mm:ss",
                      )}
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
                        selectedLog.field_name === "creation"
                          ? "Record Created"
                          : selectedLog.field_name === "deletion"
                            ? "Record Deleted"
                            : `Field Updated: ${selectedLog.field_name}`
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="User"
                      secondary={
                        selectedLog.users
                          ? `${selectedLog.users.full_name || "Unknown"} (${
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
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
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
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
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
}
