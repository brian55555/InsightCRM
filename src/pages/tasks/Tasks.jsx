// Main Tasks Page (pages/tasks/Tasks.jsx)
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Grid from "@mui/material/Grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import TasksList from "./TasksList.jsx";

// Task status options
const STATUS_OPTIONS = ["All", "Pending", "In Progress", "Completed"];

export default function Tasks() {
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "All",
    dueDate: null,
    assignedTo: "",
  });

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Tasks
      </Typography>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search Tasks"
              variant="outlined"
              size="small"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={filters.dueDate}
                onChange={(date) => handleFilterChange("dueDate", date)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    variant: "outlined",
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Clear Filters</InputLabel>
              <Select
                value=""
                label="Clear Filters"
                onChange={() => {
                  setFilters({
                    searchTerm: "",
                    status: "All",
                    dueDate: null,
                    assignedTo: "",
                  });
                }}
              >
                <MenuItem value="">Reset All Filters</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TasksList filters={filters} />
    </Box>
  );
}
