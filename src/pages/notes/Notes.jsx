// Main Notes Page (pages/notes/Notes.jsx)
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import NotesList from "./NotesList.jsx";

export default function Notes() {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Notes
      </Typography>

      <NotesList />
    </Box>
  );
}
