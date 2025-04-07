// Tasks List Component (pages/tasks/TasksList.jsx)
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, isAfter, isBefore, isToday } from "date-fns";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

// Task status options
const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];

export default function TasksList({ businessId }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentTask, setCurrentTask] = useState({
    title: "",
    description: "",
    status: "Pending",
    due_date: new Date(),
    business_id: businessId || "",
    assigned_to: user?.id || "",
  });

  useEffect(() => {
    fetchTasks();
    if (!businessId) {
      fetchBusinesses();
    }
    fetchUsers();
  }, [businessId, page, rowsPerPage]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Build the query
      let query = supabase.from("tasks").select(
        `
          *,
          businesses:business_id (id, name),
          users:assigned_to (id, email, full_name)
        `,
        { count: "exact" },
      );

      // Add filters if necessary
      if (businessId) {
        query = query.eq("business_id", businessId);
      }

      // Add pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      // Execute query
      const { data, count, error } = await query
        .order("due_date", { ascending: true })
        .range(from, to);

      if (error) throw error;

      setTasks(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .order("name");

      if (error) throw error;

      setBusinesses(data || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("approved", true)
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

  const handleDialogOpen = (task = null) => {
    if (task) {
      setCurrentTask({
        ...task,
        due_date: new Date(task.due_date),
      });
    } else {
      setCurrentTask({
        title: "",
        description: "",
        status: "Pending",
        due_date: new Date(),
        business_id: businessId || "",
        assigned_to: user?.id || "",
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDeleteDialogOpen = (task) => {
    setCurrentTask(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTask({
      ...currentTask,
      [name]: value,
    });
  };

  const handleDateChange = (date) => {
    setCurrentTask({
      ...currentTask,
      due_date: date,
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (
        !currentTask.title ||
        !currentTask.due_date ||
        !currentTask.business_id
      ) {
        alert("Title, due date, and business are required fields");
        return;
      }

      const isEditing = !!currentTask.id;

      if (isEditing) {
        // Log old values before updating
        const oldTask = tasks.find((t) => t.id === currentTask.id);

        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update({
            title: currentTask.title,
            description: currentTask.description,
            status: currentTask.status,
            due_date: currentTask.due_date,
            business_id: currentTask.business_id,
            assigned_to: currentTask.assigned_to,
            updated_at: new Date(),
          })
          .eq("id", currentTask.id);

        if (error) throw error;

        // Log the change
        await supabase.from("change_logs").insert([
          {
            table_name: "tasks",
            record_id: currentTask.id,
            field_name: "multiple fields",
            old_value: JSON.stringify(oldTask),
            new_value: JSON.stringify(currentTask),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      } else {
        // Create new task
        const { data, error } = await supabase
          .from("tasks")
          .insert([
            {
              title: currentTask.title,
              description: currentTask.description,
              status: currentTask.status,
              due_date: currentTask.due_date,
              business_id: currentTask.business_id,
              assigned_to: currentTask.assigned_to,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ])
          .select();

        if (error) throw error;

        // Log the creation
        if (data && data[0]) {
          await supabase.from("change_logs").insert([
            {
              table_name: "tasks",
              record_id: data[0].id,
              field_name: "creation",
              old_value: null,
              new_value: JSON.stringify(data[0]),
              changed_by: user.id,
              changed_at: new Date(),
            },
          ]);
        }
      }

      // Refresh tasks
      fetchTasks();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Error saving task. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", currentTask.id);

      if (error) throw error;

      // Log the deletion
      await supabase.from("change_logs").insert([
        {
          table_name: "tasks",
          record_id: currentTask.id,
          field_name: "deletion",
          old_value: JSON.stringify(currentTask),
          new_value: null,
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);

      fetchTasks();
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "In Progress":
        return "info";
      case "Completed":
        return "success";
      default:
        return "default";
    }
  };

  const getDueDateColor = (dueDate) => {
    const date = new Date(dueDate);

    if (isToday(date)) {
      return "#ffeb3b"; // Yellow
    } else if (isBefore(date, new Date())) {
      return "#f44336"; // Red
    }

    return "inherit";
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
          {businessId ? "Business Tasks" : "All Tasks"}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add Task
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              {!businessId && <TableCell>Business</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={businessId ? 5 : 6} align="center">
                  Loading tasks...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={businessId ? 5 : 6} align="center">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="body2" color="text.secondary">
                        {task.description?.length > 100
                          ? `${task.description.substring(0, 100)}...`
                          : task.description}
                      </Typography>
                    )}
                  </TableCell>

                  {!businessId && (
                    <TableCell>{task.businesses?.name || "-"}</TableCell>
                  )}

                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography
                      style={{
                        color: getDueDateColor(task.due_date),
                        fontWeight: isToday(new Date(task.due_date))
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {format(new Date(task.due_date), "MMM d, yyyy")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {task.users?.full_name || task.users?.email || "-"}
                  </TableCell>

                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(task)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDialogOpen(task)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Task Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentTask.id ? "Edit Task" : "Add New Task"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="title"
              label="Task Title"
              value={currentTask.title}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              fullWidth
              name="description"
              label="Description"
              multiline
              rows={3}
              value={currentTask.description || ""}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              required
              select
              fullWidth
              name="status"
              label="Status"
              value={currentTask.status}
              onChange={handleInputChange}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={currentTask.due_date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    margin: "normal",
                    required: true,
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>

            <TextField
              margin="normal"
              required
              select
              fullWidth
              name="business_id"
              label="Business"
              value={currentTask.business_id}
              onChange={handleInputChange}
              disabled={!!businessId}
            >
              {!businessId &&
                businesses.map((business) => (
                  <MenuItem key={business.id} value={business.id}>
                    {business.name}
                  </MenuItem>
                ))}
              {businessId && (
                <MenuItem value={businessId}>
                  {businesses.find((b) => b.id === businessId)?.name ||
                    "Current Business"}
                </MenuItem>
              )}
            </TextField>

            <TextField
              margin="normal"
              required
              select
              fullWidth
              name="assigned_to"
              label="Assigned To"
              value={currentTask.assigned_to}
              onChange={handleInputChange}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentTask.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this task? This action cannot be
            undone.
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
