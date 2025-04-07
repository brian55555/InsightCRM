// Dashboard Page (pages/Dashboard.js)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import BusinessIcon from "@mui/icons-material/Business";
import ContactsIcon from "@mui/icons-material/Contacts";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { format } from "date-fns";
import supabase from "../supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    businesses: 0,
    contacts: 0,
    tasks: 0,
    documents: 0,
  });
  const [recentBusinesses, setRecentBusinesses] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchRecentBusinesses(),
        fetchUpcomingTasks(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  const fetchStats = async () => {
    try {
      // Fetch business count
      const { count: businessCount, error: businessError } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true });

      if (businessError) throw businessError;

      // Fetch contact count
      const { count: contactCount, error: contactError } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true });

      if (contactError) throw contactError;

      // Fetch task count
      const { count: taskCount, error: taskError } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      if (taskError) throw taskError;

      // Fetch document count
      const { count: documentCount, error: documentError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

      if (documentError) throw documentError;

      setStats({
        businesses: businessCount || 0,
        contacts: contactCount || 0,
        tasks: taskCount || 0,
        documents: documentCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentBusinesses(data || []);
    } catch (error) {
      console.error("Error fetching recent businesses:", error);
    }
  };

  const fetchUpcomingTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          id, title, status, due_date,
          businesses:business_id (id, name)
        `,
        )
        .eq("assigned_to", user.id)
        .eq("status", "Pending")
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      setUpcomingTasks(data || []);
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Researching":
        return "info.main";
      case "Contacting":
        return "warning.main";
      case "Negotiating":
        return "secondary.main";
      case "Partner":
        return "success.main";
      case "Inactive":
        return "text.disabled";
      default:
        return "text.primary";
    }
  };

  const StatCard = ({ icon, count, label, onClick }) => (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        },
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.light",
            borderRadius: "50%",
            p: 1.5,
            mb: 2,
            width: 64,
            height: 64,
          }}
        >
          {React.cloneElement(icon, {
            sx: { fontSize: 32, color: "primary.main" },
          })}
        </Box>
        <Typography
          variant="h4"
          component="div"
          sx={{ fontWeight: "bold", mb: 1 }}
        >
          {count}
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<BusinessIcon />}
            count={stats.businesses}
            label="Businesses"
            onClick={() => navigate("/businesses")}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ContactsIcon />}
            count={stats.contacts}
            label="Contacts"
            onClick={() => navigate("/contacts")}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AssignmentIcon />}
            count={stats.tasks}
            label="Tasks"
            onClick={() => navigate("/tasks")}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<DescriptionIcon />}
            count={stats.documents}
            label="Documents"
            onClick={() => navigate("/documents")}
          />
        </Grid>
      </Grid>

      {/* Recent Businesses and Upcoming Tasks */}
      <Grid container spacing={3}>
        {/* Recent Businesses */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%", borderRadius: 2, overflow: "hidden" }}>
            <CardHeader
              title="Recent Businesses"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              action={
                <Button
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/businesses")}
                >
                  View All
                </Button>
              }
              sx={{
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
                py: 2,
              }}
            />
            <List sx={{ p: 0 }}>
              {loading ? (
                <ListItem>
                  <ListItemText primary="Loading..." />
                </ListItem>
              ) : recentBusinesses.length > 0 ? (
                recentBusinesses.map((business) => (
                  <React.Fragment key={business.id}>
                    <ListItem
                      button
                      onClick={() => navigate(`/businesses/${business.id}`)}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: "primary.light",
                            color: "primary.main",
                          }}
                        >
                          <BusinessIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500 }}
                          >
                            {business.name}
                          </Typography>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              component="span"
                              variant="body2"
                              color={getStatusColor(business.status)}
                              sx={{ fontWeight: "bold", mr: 1 }}
                            >
                              {business.status}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(
                                new Date(business.created_at),
                                "MMM d, yyyy",
                              )}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No businesses found"
                    secondary="Add a new business to get started"
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%", borderRadius: 2, overflow: "hidden" }}>
            <CardHeader
              title="Your Upcoming Tasks"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              action={
                <Button
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/tasks")}
                >
                  View All
                </Button>
              }
              sx={{
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
                py: 2,
              }}
            />
            <List sx={{ p: 0 }}>
              {loading ? (
                <ListItem>
                  <ListItemText primary="Loading..." />
                </ListItem>
              ) : upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <ListItem
                      button
                      onClick={() => navigate(`/tasks?id=${task.id}`)}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: "primary.light",
                            color: "primary.main",
                          }}
                        >
                          <AssignmentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500 }}
                          >
                            {task.title}
                          </Typography>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              component="span"
                              variant="body2"
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              {task.businesses?.name || "No business"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Due:{" "}
                              {format(new Date(task.due_date), "MMM d, yyyy")}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText
                    primary="No upcoming tasks"
                    secondary="You're all caught up!"
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
