// All Contacts Page (pages/contacts/Contacts.jsx)
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContactsList from "./ContactsList";

export default function Contacts() {
  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Contacts
      </Typography>

      <ContactsList />
    </Box>
  );
}
