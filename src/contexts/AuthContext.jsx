// ======= Authentication Context (contexts/AuthContext.js) =======
import React, { createContext, useState, useEffect, useContext } from "react";
import supabase from "../supabase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
      } else {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          fetchUserDetails(session.user.id);
        } else {
          setLoading(false);
        }
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        fetchUserDetails(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserDetails(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role, approved")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      setUserRole(data.role);
      setIsApproved(data.approved);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, fullName) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Create a user record in our users table
      if (user) {
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            role: "user", // Default role
            approved: false, // Needs admin approval
            created_at: new Date(),
          },
        ]);

        if (insertError) {
          throw insertError;
        }
      }

      return {
        user,
        message: "Registration successful. Please wait for admin approval.",
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if user is approved
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("approved, role")
        .eq("id", data.user.id)
        .single();

      if (userError) {
        throw userError;
      }

      if (!userData.approved) {
        // Sign out the user if not approved
        await supabase.auth.signOut();
        throw new Error(
          "Your account is pending approval by an administrator.",
        );
      }

      setUserRole(userData.role);
      setIsApproved(userData.approved);

      // Update last login time
      await supabase
        .from("users")
        .update({ last_login: new Date() })
        .eq("id", data.user.id);

      return { user: data.user };
    } catch (error) {
      return { error: error.message };
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  }

  async function resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw error;
      }

      return { message: "Password reset email sent." };
    } catch (error) {
      return { error: error.message };
    }
  }

  const value = {
    user,
    session,
    userRole,
    isApproved,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
