// Admin Panel Components

// Admin Panel Main Component (pages/admin/AdminPanel.jsx)
import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import UserManagement from "./UserManagement.jsx";
import DriveIntegration from "./DriveIntegration.jsx";
import SystemLogs from "./SystemLogs.jsx";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);

    switch (newValue) {
      case 0:
        navigate("/admin/users");
        break;
      case 1:
        navigate("/admin/drive");
        break;
      case 2:
        navigate("/admin/logs");
        break;
      default:
        navigate("/admin/users");
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
          <Tab label="Dropbox Integration" />
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
