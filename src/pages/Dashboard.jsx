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
import BusinessIcon from "@mui/icons-material/Business";
import ContactsIcon from "@mui/icons-material/Contacts";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
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

  useEffect(() => {
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

    fetchStats();
    fetchRecentBusinesses();
    fetchUpcomingTasks();
  }, [user.id]);

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

  return (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {stats.businesses}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Businesses
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <ContactsIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {stats.contacts}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Contacts
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {stats.tasks}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Tasks
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <DescriptionIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {stats.documents}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Documents
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Businesses */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Recent Businesses"
            action={
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/businesses")}
              >
                View All
              </Button>
            }
          />
          <Divider />
          <List sx={{ p: 0 }}>
            {recentBusinesses.length > 0 ? (
              recentBusinesses.map((business) => (
                <React.Fragment key={business.id}>
                  <ListItem
                    button
                    onClick={() => navigate(`/businesses/${business.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <BusinessIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={business.name}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color={getStatusColor(business.status)}
                            sx={{ fontWeight: "bold", mr: 1 }}
                          >
                            {business.status}
                          </Typography>
                          {format(new Date(business.created_at), "MMM d, yyyy")}
                        </>
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
        <Card>
          <CardHeader
            title="Your Upcoming Tasks"
            action={
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/tasks")}
              >
                View All
              </Button>
            }
          />
          <Divider />
          <List sx={{ p: 0 }}>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <React.Fragment key={task.id}>
                  <ListItem
                    button
                    onClick={() => navigate(`/tasks?id=${task.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <AssignmentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ mr: 1 }}
                          >
                            {task.businesses?.name || "No business"}
                          </Typography>
                          Due: {format(new Date(task.due_date), "MMM d, yyyy")}
                        </>
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
  );
}
