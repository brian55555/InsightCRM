// Business Detail Page (pages/businesses/BusinessDetail.jsx)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ContactsIcon from "@mui/icons-material/Contacts";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import NoteIcon from "@mui/icons-material/Note";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import { format } from "date-fns";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

// Business Contacts Component
import ContactsList from "../contacts/ContactsList.jsx";
// Business Tasks Component
import TasksList from "../tasks/TasksList.jsx";
// Business Documents Component
import DocumentsList from "../documents/DocumentsList.jsx";
// Business Notes Component
import NotesList from "../notes/NotesList.jsx";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`business-tabpanel-${index}`}
      aria-labelledby={`business-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchBusiness();
    checkFavorite();
  }, [id]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setBusiness(data);
    } catch (error) {
      console.error("Error fetching business:", error);
      navigate("/businesses");
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_id", id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setIsFavorite(!!data);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("business_id", id);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase.from("user_favorites").insert([
          {
            user_id: user.id,
            business_id: id,
            created_at: new Date(),
          },
        ]);

        if (error) throw error;
      }

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading business details...</Typography>
      </Box>
    );
  }

  if (!business) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Business not found</Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/businesses")}
          sx={{ mt: 2 }}
        >
          Back to Businesses
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Business Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h4" component="h1">
                {business.name}
              </Typography>
              <IconButton
                color={isFavorite ? "warning" : "default"}
                onClick={toggleFavorite}
              >
                {isFavorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Chip
                label={business.status}
                color={getStatusColor(business.status)}
              />
              <Typography variant="body2" color="text.secondary">
                Last updated:{" "}
                {format(new Date(business.updated_at), "MMM d, yyyy")}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/businesses?edit=${business.id}`)}
          >
            Edit
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Description
            </Typography>
            <Typography variant="body1">
              {business.description || "No description available"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Business Details
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <BusinessIcon color="action" fontSize="small" />
                <Typography variant="body2">
                  {business.address || "No address available"}
                </Typography>
              </Box>

              {business.website && (
                <Box display="flex" alignItems="center" gap={1}>
                  <DescriptionIcon color="action" fontSize="small" />
                  <Typography variant="body2">
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
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<ContactsIcon />} label="Contacts" />
          <Tab icon={<AssignmentIcon />} label="Tasks" />
          <Tab icon={<DescriptionIcon />} label="Documents" />
          <Tab icon={<NoteIcon />} label="Notes" />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <ContactsList businessId={id} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TasksList businessId={id} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <DocumentsList businessId={id} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <NotesList businessId={id} />
        </TabPanel>
      </Paper>
    </Box>
  );
}
