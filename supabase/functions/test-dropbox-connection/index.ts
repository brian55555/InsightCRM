// Edge function to test Dropbox connection

// Improved Edge Function with better error handling

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
    console.log("Edge function received request");

    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid request body format: " + parseError.message,
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

    const { app_key, app_secret, access_token, root_folder_path } = requestBody;
    console.log("Extracted credentials from request");

    // Validate input
    if (!app_key || !app_secret || !access_token) {
      console.error("Missing required parameters");
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

    console.log("Testing access token with Dropbox API");
    // Test the access token by making a request to the Dropbox API
    let accountResponse;
    try {
      accountResponse = await fetch(
        "https://api.dropboxapi.com/2/users/get_current_account",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            // IMPORTANT: No Content-Type header for this endpoint as it doesn't expect a body
          },
          // IMPORTANT: No body parameter for this endpoint
        },
      );
      console.log("Dropbox API response status:", accountResponse.status);
    } catch (fetchError) {
      console.error("Network error when contacting Dropbox API:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Network error when contacting Dropbox API: ${fetchError.message}`,
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

    if (!accountResponse.ok) {
      let errorData;
      try {
        errorData = await accountResponse.text();
        console.error("Dropbox authentication error:", errorData);
      } catch (textError) {
        console.error("Error reading error response:", textError);
        errorData = "Could not read error details";
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to authenticate with Dropbox: ${errorData}`,
          status: accountResponse.status,
          statusText: accountResponse.statusText,
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

    let accountData;
    try {
      accountData = await accountResponse.json();
      console.log("Successfully retrieved account data");
    } catch (jsonError) {
      console.error("Error parsing account data:", jsonError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error parsing account data: ${jsonError.message}`,
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

    console.log("Testing folder access");
    // Now test access to the specified folder path
    const folderPath = root_folder_path || "/";
    let listFolderResponse;
    try {
      listFolderResponse = await fetch(
        "https://api.dropboxapi.com/2/files/list_folder",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: folderPath === "/" ? "" : folderPath,
            recursive: false,
            include_media_info: false,
            include_deleted: false,
            include_has_explicit_shared_members: false,
          }),
        },
      );
      console.log("Folder access response status:", listFolderResponse.status);
    } catch (folderFetchError) {
      console.error("Network error when accessing folder:", folderFetchError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Network error when accessing folder: ${folderFetchError.message}`,
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

    if (!listFolderResponse.ok) {
      let errorData;
      try {
        errorData = await listFolderResponse.json();
        console.error("Folder access error:", errorData);
      } catch (jsonError) {
        console.error("Error parsing folder error response:", jsonError);
        try {
          errorData = await listFolderResponse.text();
        } catch (textError) {
          errorData = "Could not read error details";
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to access folder path: ${typeof errorData === "object" ? errorData.error_summary || JSON.stringify(errorData) : errorData}`,
          status: listFolderResponse.status,
          statusText: listFolderResponse.statusText,
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

    console.log("All checks passed, connection successful");
    // All checks passed
    return new Response(
      JSON.stringify({
        success: true,
        message: "Connection successful",
        folder: {
          path: folderPath,
          name: folderPath === "/" ? "Root" : folderPath.split("/").pop(),
        },
        account: {
          name: accountData.name.display_name,
          email: accountData.email,
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
    console.error("Error testing Dropbox connection:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "An unexpected error occurred",
        stack: error.stack,
        name: error.name,
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
