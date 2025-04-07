// Google Drive Integration Component (pages/admin/DriveIntegration.jsx)
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function DriveIntegration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [settings, setSettings] = useState({
    client_id: "",
    client_secret: "",
    refresh_token: "",
    root_folder_id: "",
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
        .from("system_settings")
        .select("*")
        .eq("key", "google_drive_settings")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found, initialize with empty settings
          setSettings({
            client_id: "",
            client_secret: "",
            refresh_token: "",
            root_folder_id: "",
            is_configured: false,
          });
        } else {
          throw error;
        }
      } else if (data) {
        setSettings(data.value || {});
        setConnectionStatus(data.value.is_configured ? "connected" : null);
      }
    } catch (error) {
      console.error("Error fetching Google Drive settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  const saveSettings = async () => {
    try {
      setSaveInProgress(true);

      // Update settings in the database
      const { error } = await supabase.from("system_settings").upsert({
        key: "google_drive_settings",
        value: settings,
        updated_by: user.id,
        updated_at: new Date(),
      });

      if (error) throw error;

      // Log the change
      await supabase.from("change_logs").insert([
        {
          table_name: "system_settings",
          record_id: "google_drive_settings",
          field_name: "value",
          old_value: JSON.stringify({
            ...settings,
            client_secret: "[REDACTED]",
          }),
          new_value: JSON.stringify({
            ...settings,
            client_secret: "[REDACTED]",
          }),
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);

      // Update UI state
      setSettings({
        ...settings,
        is_configured: true,
      });
      setConnectionStatus("connected");
    } catch (error) {
      console.error("Error saving Google Drive settings:", error);
      alert("Error saving settings. Please try again.");
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
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Set connection status based on whether all required fields are filled
      if (
        settings.client_id &&
        settings.client_secret &&
        settings.refresh_token &&
        settings.root_folder_id
      ) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("error");
      }
    } catch (error) {
      console.error("Error testing Google Drive connection:", error);
      setConnectionStatus("error");
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
          {connectionStatus === "connected" ? (
            <>
              <CloudDoneIcon color="success" sx={{ mr: 1 }} />
              <Typography color="success.main">
                Connected to Google Drive
              </Typography>
            </>
          ) : connectionStatus === "error" ? (
            <>
              <CloudOffIcon color="error" sx={{ mr: 1 }} />
              <Typography color="error">
                Connection error. Please check your credentials.
              </Typography>
            </>
          ) : (
            <>
              <CloudUploadIcon color="warning" sx={{ mr: 1 }} />
              <Typography color="warning.main">Not configured yet</Typography>
            </>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={testConnection}
            disabled={testingConnection}
            sx={{ ml: "auto" }}
          >
            {testingConnection ? "Testing..." : "Test Connection"}
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          To integrate with Google Drive, you need to create a project in the
          Google Cloud Console, enable the Google Drive API, and create OAuth
          credentials. Please refer to the
          <a
            href="https://developers.google.com/drive/api/v3/quickstart/nodejs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 4 }}
          >
            Google Drive API documentation
          </a>{" "}
          for more details.
        </Alert>

        <Divider sx={{ my: 3 }} />

        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="client_id"
            label="OAuth Client ID"
            value={settings.client_id || ""}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="client_secret"
            label="OAuth Client Secret"
            type="password"
            value={settings.client_secret || ""}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="refresh_token"
            label="Refresh Token"
            value={settings.refresh_token || ""}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="root_folder_id"
            label="Root Folder ID"
            helperText="The ID of the Google Drive folder where all documents will be stored"
            value={settings.root_folder_id || ""}
            onChange={handleInputChange}
          />

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={saveInProgress}
            sx={{ mt: 3 }}
          >
            {saveInProgress ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
