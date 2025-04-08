import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { exchangeCodeForTokens } from "../../utils/oauth";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function OAuthCallback() {
  const [status, setStatus] = useState("processing"); // 'processing', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse the URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get("code");
        const state = queryParams.get("state");
        const error = queryParams.get("error");

        // Check for errors in the callback
        if (error) {
          throw new Error(`Authorization failed: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        // Verify state parameter (should match what you stored)
        // In a real app, you'd compare with a state from session storage
        // const storedState = sessionStorage.getItem('oauth_state');
        // if (state !== storedState) {
        //   throw new Error('State validation failed');
        // }

        // Get client credentials from system settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "google_drive_settings")
          .single();

        if (settingsError) {
          throw new Error("Failed to retrieve OAuth settings");
        }

        const { client_id, client_secret } = settingsData.value;

        // The redirect URI should match exactly what you configured in Google Cloud Console
        const redirectUri = window.location.origin + "/admin/oauth-callback";

        // Exchange the code for tokens
        const tokenData = await exchangeCodeForTokens(
          code,
          client_id,
          client_secret,
          redirectUri,
        );

        // Save the tokens to your database
        const { error: updateError } = await supabase
          .from("system_settings")
          .update({
            value: {
              ...settingsData.value,
              refresh_token: tokenData.refresh_token,
              access_token: tokenData.access_token, // Optional, as it expires
              token_expiry: new Date(
                Date.now() + tokenData.expires_in * 1000,
              ).toISOString(),
              is_configured: true,
              last_updated: new Date().toISOString(),
            },
            updated_by: user.id,
            updated_at: new Date(),
          })
          .eq("key", "google_drive_settings");

        if (updateError) {
          throw new Error("Failed to save tokens");
        }

        // Log the successful connection
        await supabase.from("change_logs").insert([
          {
            table_name: "system_settings",
            record_id: "google_drive_settings",
            field_name: "oauth_connection",
            old_value: JSON.stringify({ status: "pending" }),
            new_value: JSON.stringify({ status: "connected" }),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);

        setStatus("success");
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setErrorMessage(error.message);
      }
    };

    handleCallback();
  }, [location, user]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 600, width: "100%" }}>
        {status === "processing" && (
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">
              Processing OAuth Authorization...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we complete the authorization process.
            </Typography>
          </Box>
        )}

        {status === "success" && (
          <Box sx={{ textAlign: "center" }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Google Drive successfully connected!
            </Alert>
            <Typography variant="body1" paragraph>
              Your Google Drive integration has been successfully set up. You
              can now use Google Drive features in the application.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/admin/drive")}
            >
              Return to Drive Integration
            </Button>
          </Box>
        )}

        {status === "error" && (
          <Box sx={{ textAlign: "center" }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Authorization Failed
            </Alert>
            <Typography variant="body1" paragraph>
              {errorMessage ||
                "There was an error connecting to Google Drive. Please try again."}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/admin/drive")}
            >
              Return to Drive Integration
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
