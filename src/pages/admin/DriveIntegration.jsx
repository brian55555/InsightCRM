// Dropbox Integration Component (pages/admin/DriveIntegration.jsx)
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
import DropboxIcon from "@mui/icons-material/CloudCircle";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function DropboxIntegration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [settings, setSettings] = useState({
    app_key: "",
    app_secret: "",
    access_token: "",
    root_folder_path: "",
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
        .eq("key", "dropbox_settings")
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
      console.error("Error fetching Dropbox settings:", error);
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

      // Validate required fields
      if (!settings.app_key || !settings.app_secret || !settings.access_token) {
        throw new Error("App Key, App Secret, and Access Token are required");
      }

      console.log("Saving Dropbox settings...");

      // Skip the connection test for now and just save the settings
      const updatedSettings = {
        ...settings,
        is_configured: true,
        last_updated: new Date().toISOString(),
      };

      console.log("Updating system_settings table...");
      const { error } = await supabase.from("system_settings").upsert({
        key: "dropbox_settings",
        value: updatedSettings,
        updated_by: user.id,
        updated_at: new Date(),
      });

      if (error) {
        console.error("Error updating system_settings:", error);
        throw error;
      }

      console.log("Logging change...");
      // Log the change
      await supabase.from("change_logs").insert([
        {
          table_name: "system_settings",
          record_id: "dropbox_settings",
          field_name: "value",
          old_value: JSON.stringify({
            ...settings,
            app_secret: "[REDACTED]",
          }),
          new_value: JSON.stringify({
            ...updatedSettings,
            app_secret: "[REDACTED]",
          }),
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);

      // Update UI state
      setSettings(updatedSettings);
      setConnectionStatus("connected");
      alert(
        "Dropbox settings saved successfully! You can now test the connection.",
      );
    } catch (error) {
      console.error("Error saving Dropbox settings:", error);
      setConnectionStatus("error");
      alert(
        `Error saving settings: ${error.message || "An unexpected error occurred"}`,
      );
    } finally {
      setSaveInProgress(false);
    }
  };

  const initiateOAuthFlow = () => {
    // Import the OAuth utility
    import("../../utils/oauth.js").then(
      ({ generateAuthUrl, generateState }) => {
        // Generate a random state parameter to prevent CSRF attacks
        const state = generateState();

        // Store the state in sessionStorage to verify when the user returns
        sessionStorage.setItem("oauth_state", state);

        // Define the redirect URI - must match what's configured in Google Cloud Console
        const redirectUri = `${window.location.origin}/admin/oauth-callback`;

        // Define the scopes needed for Google Drive access
        const scope = "https://www.googleapis.com/auth/drive.file";

        // Generate the authorization URL
        const authUrl = generateAuthUrl(
          settings.client_id,
          redirectUri,
          scope,
          state,
        );

        // Redirect the user to the authorization URL
        window.location.href = authUrl;
      },
    );
  };

  const testConnection = async () => {
    try {
      setTestingConnection(true);

      // Check if all required fields are filled
      if (!settings.app_key || !settings.app_secret || !settings.access_token) {
        setConnectionStatus("error");
        throw new Error("App Key, App Secret, and Access Token are required");
      }

      console.log("Testing Dropbox connection...");

      // First, test direct Dropbox API access without the Edge Function
      try {
        // Try a direct test to Dropbox API to check if credentials are valid
        // Note: This endpoint doesn't expect a body or Content-Type header
        const response = await fetch(
          "https://api.dropboxapi.com/2/users/get_current_account",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${settings.access_token}`,
            },
          },
        );

        if (response.ok) {
          console.log("Direct Dropbox API test successful");
          const accountData = await response.json();
          console.log("Account data:", accountData);

          // If direct test works but Edge Function fails, we know it's an Edge Function issue
          try {
            // Call Supabase Edge Function to test Dropbox connection
            const { data, error } = await supabase.functions.invoke(
              "test-dropbox-connection",
              {
                body: {
                  app_key: settings.app_key,
                  app_secret: settings.app_secret,
                  access_token: settings.access_token,
                  root_folder_path: settings.root_folder_path || "/",
                },
              },
            );

            console.log("Edge function response:", { data, error });

            if (error) {
              console.error("Edge function error:", error);
              // If direct test worked but Edge Function failed, still mark as connected
              setConnectionStatus("connected");
              alert(
                "Connection to Dropbox is working, but the Edge Function test failed. Your credentials are valid, but there may be an issue with the Edge Function deployment.",
              );
              return;
            }

            if (data && data.success) {
              setConnectionStatus("connected");
              alert("Connection successful! Dropbox is properly configured.");
            } else {
              setConnectionStatus("error");
              throw new Error(data?.message || "Unknown error");
            }
          } catch (edgeFunctionError) {
            console.error("Edge function execution error:", edgeFunctionError);
            // If direct test worked but Edge Function failed, still mark as connected
            setConnectionStatus("connected");
            alert(
              "Connection to Dropbox is working, but the Edge Function test failed. Your credentials are valid, but there may be an issue with the Edge Function deployment.",
            );
          }
        } else {
          let errorMessage = "Direct Dropbox API test failed";
          try {
            const errorData = await response.json();
            console.error("Direct Dropbox API test failed:", errorData);
            errorMessage = `${errorMessage}: ${errorData.error_summary || JSON.stringify(errorData)}`;
          } catch (jsonError) {
            // If not JSON, try to get as text
            try {
              const errorText = await response.text();
              console.error("Direct Dropbox API test failed:", errorText);
              errorMessage = `${errorMessage}: ${errorText}`;
            } catch (textError) {
              console.error("Could not parse error response", textError);
              errorMessage = `${errorMessage}: Status ${response.status}`;
            }
          }
          throw new Error(errorMessage);
        }
      } catch (directTestError) {
        console.error("Error in direct Dropbox API test:", directTestError);

        // If direct test fails, try the Edge Function as a fallback
        try {
          const { data, error } = await supabase.functions.invoke(
            "test-dropbox-connection",
            {
              body: {
                app_key: settings.app_key,
                app_secret: settings.app_secret,
                access_token: settings.access_token,
                root_folder_path: settings.root_folder_path || "/",
              },
            },
          );

          if (error) {
            console.error("Edge function error:", error);
            throw error;
          }

          if (data && data.success) {
            setConnectionStatus("connected");
            alert("Connection successful! Dropbox is properly configured.");
          } else {
            setConnectionStatus("error");
            throw new Error(data?.message || "Unknown error");
          }
        } catch (edgeFunctionError) {
          console.error(
            "Both direct test and Edge Function failed:",
            edgeFunctionError,
          );
          throw new Error(
            "Failed to connect to Dropbox using both direct API and Edge Function. Please check your credentials.",
          );
        }
      }
    } catch (error) {
      console.error("Error testing Dropbox connection:", error);
      setConnectionStatus("error");
      alert(
        `Connection error: ${error.message || "Failed to connect to Dropbox. Please check your credentials and try again."}`,
      );
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
        Dropbox Integration
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Connection Status
        </Typography>

        <Box display="flex" alignItems="center" mb={2}>
          {connectionStatus === "connected" ? (
            <>
              <CloudDoneIcon color="success" sx={{ mr: 1 }} />
              <Typography color="success.main">Connected to Dropbox</Typography>
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
          To integrate with Dropbox, you need to create an app in the Dropbox
          Developer Console and generate an access token. Please refer to the
          <a
            href="https://www.dropbox.com/developers/documentation/http/overview"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 4 }}
          >
            Dropbox API documentation
          </a>{" "}
          for more details.
          <br />
          <br />
          <strong>Important:</strong> Make sure to:
          <ul>
            <li>
              Create a Dropbox app in the{" "}
              <a
                href="https://www.dropbox.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dropbox App Console
              </a>
            </li>
            <li>Choose "Scoped access" for your app type</li>
            <li>
              Select "Full Dropbox" access (or create a dedicated folder for
              this app)
            </li>
            <li>
              Generate an access token with the required permissions
              (files.content.read, files.content.write, files.metadata.read,
              files.metadata.write)
            </li>
            <li>
              Copy your App key, App secret, and Access token to the fields
              below
            </li>
          </ul>
        </Alert>

        <Divider sx={{ my: 3 }} />

        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="app_key"
            label="Dropbox App Key"
            value={settings.app_key || ""}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="app_secret"
            label="Dropbox App Secret"
            type="password"
            value={settings.app_secret || ""}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="access_token"
            label="Access Token"
            value={settings.access_token || ""}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="root_folder_path"
            label="Root Folder Path"
            helperText="The path of the Dropbox folder where all documents will be stored (e.g., /InsightCRM or leave empty for root)"
            value={settings.root_folder_path || ""}
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
