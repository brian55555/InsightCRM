// ======= Theme Configuration (theme.js) =======
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0066FF", // Professional blue
    },
    secondary: {
      main: "#2D3748", // Slate
    },
    background: {
      default: "#FFFFFF", // White
      paper: "#FFFFFF", // Changed to white for cards
    },
    text: {
      primary: "#1A202C", // Dark text
    },
    success: {
      main: "#4CAF50", // Green
    },
    warning: {
      main: "#FFA500", // Orange
    },
    error: {
      main: "#F44336", // Red
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
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      },
    },
  },
  spacing: 8, // Base spacing unit (8px)
});

export default theme;
