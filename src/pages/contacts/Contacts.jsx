// All Contacts Page (pages/contacts/Contacts.jsx)
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import ContactsList from "./ContactsList";

export default function Contacts() {
  const [viewMode, setViewMode] = useState("gallery");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBusiness, setFilterBusiness] = useState("all");

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleBusinessFilterChange = (event) => {
    setFilterBusiness(event.target.value);
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Contacts
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
          <ToggleButton value="gallery" aria-label="gallery view">
            <ViewModuleIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Filter by Business"
              value={filterBusiness}
              onChange={handleBusinessFilterChange}
              size="small"
            >
              <MenuItem value="all">All Businesses</MenuItem>
              <MenuItem value="recent">Recently Added</MenuItem>
              <MenuItem value="no-business">No Business Assigned</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <ContactsList
        viewMode={viewMode}
        searchQuery={searchQuery}
        filterBusiness={filterBusiness}
      />
    </Box>
  );
}
