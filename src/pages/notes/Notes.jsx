// Main Notes Page (pages/notes/Notes.jsx)
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import NotesList from "./NotesList.jsx";

// Note categories from NotesList.jsx
const NOTE_CATEGORIES = [
  "All Categories",
  "General",
  "Meeting",
  "Call",
  "Email",
  "Task",
  "Idea",
  "Issue",
  "Other",
];

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterBusiness, setFilterBusiness] = useState("");

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setFilterCategory(event.target.value);
  };

  const handleBusinessChange = (event) => {
    setFilterBusiness(event.target.value);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Notes
      </Typography>

      {/* Filter Section */}
      <Box
        mb={3}
        sx={{ backgroundColor: "background.paper", p: 2, borderRadius: 1 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search notes..."
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
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Category"
              value={filterCategory}
              onChange={handleCategoryChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            >
              {NOTE_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Business"
              value={filterBusiness}
              onChange={handleBusinessChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            >
              <MenuItem value="">All Businesses</MenuItem>
              <MenuItem value="recent">Recently Added</MenuItem>
              <MenuItem value="none">No Business Assigned</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <NotesList
        searchQuery={searchQuery}
        filterCategory={filterCategory}
        filterBusiness={filterBusiness}
      />
    </Box>
  );
}
