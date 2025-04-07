// ======= Main App Component (App.js) =======
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import PendingApproval from "./pages/auth/PendingApproval";

// App Pages
import Dashboard from "./pages/Dashboard";
import Businesses from "./pages/businesses/Businesses.jsx";
import BusinessDetail from "./pages/businesses/BusinessDetail";
import Contacts from "./pages/contacts/Contacts.jsx";
import Tasks from "./pages/tasks/Tasks.jsx";
import Documents from "./pages/documents/Documents.jsx";
import Notes from "./pages/notes/Notes.jsx";
import AdminPanel from "./pages/admin/AdminPanel.jsx";
import Layout from "./components/layout/Layout.jsx";

function App() {
  const { user, loading, isApproved, userRole } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Register />}
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/pending-approval"
        element={
          user && !isApproved ? <PendingApproval /> : <Navigate to="/" />
        }
      />

      {/* App Routes - Protected by authentication */}
      <Route
        path="/"
        element={
          user ? (
            isApproved ? (
              <Layout />
            ) : (
              <Navigate to="/pending-approval" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="businesses/:id" element={<BusinessDetail />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="documents" element={<Documents />} />
        <Route path="notes" element={<Notes />} />

        {/* Admin routes - Protected by role */}
        <Route
          path="admin/*"
          element={userRole === "admin" ? <AdminPanel /> : <Navigate to="/" />}
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
