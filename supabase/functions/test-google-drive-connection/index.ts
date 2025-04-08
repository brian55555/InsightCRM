// Edge function to test Google Drive connection

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface GoogleDriveSettings {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  root_folder_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { client_id, client_secret, refresh_token, root_folder_id } =
      (await req.json()) as GoogleDriveSettings;

    // Validate input
    if (!client_id || !client_secret || !refresh_token || !root_folder_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required parameters",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Get a new access token using the refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to get access token: ${tokenData.error_description || tokenData.error || "Unknown error"}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Test access to the root folder
    const folderResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${root_folder_id}?fields=id,name,mimeType`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    const folderData = await folderResponse.json();

    if (!folderResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to access root folder: ${folderData.error?.message || "Unknown error"}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Check if the folder exists and is actually a folder
    if (folderData.mimeType !== "application/vnd.google-apps.folder") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "The provided ID is not a folder",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // All checks passed
    return new Response(
      JSON.stringify({
        success: true,
        message: "Connection successful",
        folder: {
          id: folderData.id,
          name: folderData.name,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error testing Google Drive connection:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
