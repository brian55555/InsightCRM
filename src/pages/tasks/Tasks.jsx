// Main Tasks Page (pages/tasks/Tasks.jsx)
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TasksList from "./TasksList.jsx";

export default function Tasks() {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Tasks
      </Typography>

      <TasksList />
    </Box>
  );
}
