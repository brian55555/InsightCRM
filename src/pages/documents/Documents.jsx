// Main Documents Page (pages/documents/Documents.jsx)
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DocumentsList from "./DocumentsList.jsx";

export default function Documents() {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Documents
      </Typography>

      <DocumentsList />
    </Box>
  );
}
