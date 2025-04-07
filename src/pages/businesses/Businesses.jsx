// Businesses Page (pages/businesses/Businesses.jsx)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { format } from "date-fns";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

// Status options for the business
const STATUS_OPTIONS = [
  "Researching",
  "Contacting",
  "Negotiating",
  "Partner",
  "Inactive",
];

export default function Businesses() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for business data
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState({
    name: "",
    description: "",
    status: "Researching",
    address: "",
    website: "",
  });

  // State for favorites
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchBusinesses();
    fetchFavorites();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);

      // Start building the query
      let query = supabase.from("businesses").select("*", { count: "exact" });

      // Add filters
      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      // Add pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      // Execute the query
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      setBusinesses(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("business_id")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setFavorites(data?.map((f) => f.business_id) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleDialogOpen = (business = null) => {
    if (business) {
      setCurrentBusiness(business);
    } else {
      setCurrentBusiness({
        name: "",
        description: "",
        status: "Researching",
        address: "",
        website: "",
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBusiness({
      ...currentBusiness,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const isEditing = !!currentBusiness.id;

      if (isEditing) {
        // Update existing business
        const { error } = await supabase
          .from("businesses")
          .update({
            name: currentBusiness.name,
            description: currentBusiness.description,
            status: currentBusiness.status,
            address: currentBusiness.address,
            website: currentBusiness.website,
            updated_at: new Date(),
          })
          .eq("id", currentBusiness.id);

        if (error) throw error;

        // Log the change
        await supabase.from("change_logs").insert([
          {
            table_name: "businesses",
            record_id: currentBusiness.id,
            field_name: "multiple fields",
            old_value: JSON.stringify(
              businesses.find((b) => b.id === currentBusiness.id),
            ),
            new_value: JSON.stringify(currentBusiness),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      } else {
        // Create new business
        const { data, error } = await supabase
          .from("businesses")
          .insert([
            {
              name: currentBusiness.name,
              description: currentBusiness.description,
              status: currentBusiness.status,
              address: currentBusiness.address,
              website: currentBusiness.website,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ])
          .select();

        if (error) throw error;

        // Log the creation
        if (data && data[0]) {
          await supabase.from("change_logs").insert([
            {
              table_name: "businesses",
              record_id: data[0].id,
              field_name: "creation",
              old_value: null,
              new_value: JSON.stringify(data[0]),
              changed_by: user.id,
              changed_at: new Date(),
            },
          ]);
        }
      }

      // Refresh the businesses list
      fetchBusinesses();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving business:", error);
      alert("Error saving business. Please try again.");
    }
  };

  const toggleFavorite = async (businessId) => {
    try {
      const isFavorite = favorites.includes(businessId);

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("business_id", businessId);

        if (error) throw error;

        setFavorites(favorites.filter((id) => id !== businessId));
      } else {
        // Add to favorites
        const { error } = await supabase.from("user_favorites").insert([
          {
            user_id: user.id,
            business_id: businessId,
            created_at: new Date(),
          },
        ]);

        if (error) throw error;

        setFavorites([...favorites, businessId]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Researching":
        return "info";
      case "Contacting":
        return "warning";
      case "Negotiating":
        return "secondary";
      case "Partner":
        return "success";
      case "Inactive":
        return "default";
      default:
        return "default";
    }
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
          Businesses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add Business
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="Search Businesses"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            sx={{ minWidth: 250 }}
          />
          <TextField
            select
            label="Status Filter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Favorite</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No businesses found
                </TableCell>
              </TableRow>
            ) : (
              businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => toggleFavorite(business.id)}
                      color={
                        favorites.includes(business.id) ? "warning" : "default"
                      }
                    >
                      {favorites.includes(business.id) ? (
                        <StarIcon />
                      ) : (
                        <StarBorderIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>{business.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={business.status}
                      color={getStatusColor(business.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {business.website ? (
                      <a
                        href={
                          business.website.startsWith("http")
                            ? business.website
                            : `https://${business.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {business.website}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {business.updated_at
                      ? format(new Date(business.updated_at), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/businesses/${business.id}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(business)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Business Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentBusiness.id ? "Edit Business" : "Add New Business"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="name"
              label="Business Name"
              value={currentBusiness.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              name="description"
              label="Description"
              multiline
              rows={3}
              value={currentBusiness.description || ""}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              select
              required
              fullWidth
              name="status"
              label="Status"
              value={currentBusiness.status}
              onChange={handleInputChange}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              name="address"
              label="Address"
              value={currentBusiness.address || ""}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              name="website"
              label="Website"
              value={currentBusiness.website || ""}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentBusiness.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
