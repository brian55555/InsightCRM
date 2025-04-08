// ======= Layout Component (components/layout/Layout.js) =======
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import ContactsIcon from "@mui/icons-material/Contacts";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import NoteIcon from "@mui/icons-material/Note";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import StarIcon from "@mui/icons-material/Star";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useAuth } from "../../contexts/AuthContext";
import supabase from "../../supabase";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export default function Layout() {
  const [open, setOpen] = useState(true);
  const [userMenu, setUserMenu] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch user favorites
    const fetchFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from("user_favorites")
          .select(
            `
            id,
            businesses:business_id (
              id,
              name
            )
          `,
          )
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        setFavorites(data || []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenu(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenu(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    navigate(openTabs[newValue].path);
  };

  const handleTabClose = (event, index) => {
    event.stopPropagation();
    const newTabs = [...openTabs];
    newTabs.splice(index, 1);
    setOpenTabs(newTabs);

    // If we're closing the current tab
    if (index === currentTab) {
      // Navigate to the previous tab or to dashboard if no tabs left
      if (newTabs.length > 0) {
        const newIndex = index > 0 ? index - 1 : 0;
        setCurrentTab(newIndex);
        navigate(newTabs[newIndex].path);
      } else {
        setCurrentTab(0);
        navigate("/");
      }
    } else if (index < currentTab) {
      // If we're closing a tab before the current tab, adjust the current tab index
      setCurrentTab(currentTab - 1);
    }
  };

  const openTab = (path, label, id) => {
    // Check if tab already exists
    const existingTabIndex = openTabs.findIndex((tab) => tab.path === path);

    if (existingTabIndex !== -1) {
      // Tab already exists, just switch to it
      setCurrentTab(existingTabIndex);
    } else {
      // Add new tab
      setOpenTabs([...openTabs, { path, label, id }]);
      setCurrentTab(openTabs.length);
    }

    navigate(path);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Businesses", icon: <BusinessIcon />, path: "/businesses" },
    { text: "Contacts", icon: <ContactsIcon />, path: "/contacts" },
    { text: "Tasks", icon: <AssignmentIcon />, path: "/tasks" },
    { text: "Documents", icon: <DescriptionIcon />, path: "/documents" },
    { text: "Notes", icon: <NoteIcon />, path: "/notes" },
  ];

  // Only add Admin Panel for admin users
  if (userRole === "admin") {
    menuItems.push({
      text: "Admin Panel",
      icon: <AdminPanelSettingsIcon />,
      path: "/admin",
    });
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBarStyled position="fixed" open={open}>
        {/* Tabs for open businesses */}
        {openTabs.length > 0 && (
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: "background.paper",
              color: "text.primary",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {openTabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {tab.label}
                    <IconButton
                      size="small"
                      onClick={(e) => handleTabClose(e, index)}
                      sx={{ ml: 1 }}
                    >
                      &times;
                    </IconButton>
                  </Box>
                }
              />
            ))}
          </Tabs>
        )}
      </AppBarStyled>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            InsightCRM
          </Typography>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>

        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {favorites.length > 0 && (
          <>
            <Divider />
            <List
              subheader={
                <Typography variant="subtitle2" sx={{ pl: 2, pt: 1 }}>
                  Favorite Businesses
                </Typography>
              }
            >
              {favorites.map((favorite) => (
                <ListItem key={favorite.id} disablePadding>
                  <ListItemButton
                    onClick={() =>
                      openTab(
                        `/businesses/${favorite.businesses.id}`,
                        favorite.businesses.name,
                        favorite.businesses.id,
                      )
                    }
                  >
                    <ListItemIcon>
                      <StarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={favorite.businesses.name}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
        {/* User profile section at bottom of sidebar */}
        <Box sx={{ mt: "auto" }}>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.dark" }}>
                {user?.email.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {user?.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Role: {userRole || "User"}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
              sx={{ mt: 1 }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
}
