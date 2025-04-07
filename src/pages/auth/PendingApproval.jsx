// Pending Approval Page (pages/auth/PendingApproval.js)
import React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useAuth } from "../../contexts/AuthContext";

export default function PendingApproval() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        <HourglassEmptyIcon
          sx={{ fontSize: 60, color: "warning.main", mb: 2 }}
        />
        <Typography variant="h4" gutterBottom>
          Account Pending Approval
        </Typography>
        <Typography variant="body1" paragraph>
          Your account has been registered but requires approval from an
          administrator before you can access the CRM.
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
}
