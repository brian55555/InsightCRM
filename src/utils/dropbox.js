/**
 * Dropbox API Utilities
 */

/**
 * Generate a Dropbox API authentication URL
 * @param {string} clientId - Your Dropbox app key
 * @param {string} redirectUri - The URI to redirect to after authorization
 * @returns {string} The authorization URL
 */
export function getAuthUrl(clientId, redirectUri) {
  const authUrl = new URL("https://www.dropbox.com/oauth2/authorize");

  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("response_type", "token");

  return authUrl.toString();
}

/**
 * Upload a file to Dropbox
 * @param {string} accessToken - Dropbox access token
 * @param {File} file - The file to upload
 * @param {string} path - The path where to store the file in Dropbox
 * @param {Function} progressCallback - Callback for upload progress
 * @returns {Promise<Object>} The upload response
 */
export async function uploadFile(accessToken, file, path, progressCallback) {
  // For files smaller than 150MB, use upload API
  const uploadUrl = "https://content.dropboxapi.com/2/files/upload";

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/octet-stream",
    "Dropbox-API-Arg": JSON.stringify({
      path: path,
      mode: "add",
      autorename: true,
      mute: false,
    }),
  };

  try {
    // Use XMLHttpRequest to track progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);

      // Set headers
      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && progressCallback) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          progressCallback(percentComplete);
        }
      };

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (parseError) {
            console.error("Error parsing Dropbox response:", parseError);
            reject(
              new Error(
                `Error parsing Dropbox response: ${parseError.message}. Raw response: ${xhr.responseText.substring(0, 100)}...`,
              ),
            );
          }
        } else {
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            // Try to parse error as JSON
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = `${errorMessage}: ${errorData.error_summary || JSON.stringify(errorData)}`;
          } catch (parseError) {
            // If not JSON, use text
            errorMessage = `${errorMessage}: ${xhr.responseText || "No error details available"}`;
          }
          reject(new Error(errorMessage));
        }
      };

      xhr.onerror = function () {
        reject(
          new Error(
            "Network error during upload. Please check your internet connection and try again.",
          ),
        );
      };

      xhr.ontimeout = function () {
        reject(
          new Error(
            "Upload timed out. Please try again with a smaller file or check your connection.",
          ),
        );
      };

      xhr.send(file);
    });
  } catch (error) {
    console.error("Error uploading file to Dropbox:", error);
    throw new Error(
      `Upload failed: ${error.message || "Unknown error occurred"}`,
    );
  }
}

/**
 * Create a folder in Dropbox
 * @param {string} accessToken - Dropbox access token
 * @param {string} path - The path where to create the folder
 * @returns {Promise<Object>} The folder creation response
 */
export async function createFolder(accessToken, path) {
  const createFolderUrl = "https://api.dropboxapi.com/2/files/create_folder_v2";

  const response = await fetch(createFolderUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: path,
      autorename: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to create folder: ${errorData.error_summary || "Unknown error"}`,
    );
  }

  return response.json();
}

/**
 * Get a shared link for a file in Dropbox
 * @param {string} accessToken - Dropbox access token
 * @param {string} path - The path to the file
 * @returns {Promise<string>} The shared link URL
 */
export async function getSharedLink(accessToken, path) {
  const shareUrl =
    "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings";

  try {
    // First try to get existing links to avoid creating duplicates
    try {
      const existingLink = await getExistingSharedLink(accessToken, path);
      return existingLink;
    } catch (existingLinkError) {
      console.log("No existing link found, creating new one");
      // Continue with creating a new link if no existing link is found
    }

    const response = await fetch(shareUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: path,
        settings: {
          requested_visibility: "public",
        },
      }),
    });

    // Clone the response so we can read it multiple times if needed
    const clonedResponse = response.clone();

    if (!response.ok) {
      let errorMessage = `Failed to create shared link: Status ${response.status}`;

      try {
        // Try to parse as JSON first
        const errorData = await response.json();

        if (
          errorData.error &&
          errorData.error[".tag"] === "shared_link_already_exists"
        ) {
          // If link already exists, get the existing link
          return getExistingSharedLink(accessToken, path);
        }

        errorMessage = `Failed to create shared link: ${errorData.error_summary || JSON.stringify(errorData)}`;
      } catch (jsonError) {
        // If JSON parsing fails, try to get as text
        try {
          const errorText = await clonedResponse.text();
          errorMessage = `Failed to create shared link: ${errorText || "Unknown error"}`;
        } catch (textError) {
          // If both fail, use the status code
          console.error("Could not read error response", textError);
        }
      }

      throw new Error(errorMessage);
    }

    try {
      const data = await response.json();
      return data.url;
    } catch (parseError) {
      console.error("Error parsing successful response:", parseError);
      throw new Error(`Error parsing Dropbox response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error creating shared link:", error);
    // Return a fallback URL if all else fails
    return `https://www.dropbox.com/home${path}`;
  }
}

/**
 * Get existing shared links for a file
 * @param {string} accessToken - Dropbox access token
 * @param {string} path - The path to the file
 * @returns {Promise<string>} The first shared link URL
 */
async function getExistingSharedLink(accessToken, path) {
  const listLinksUrl = "https://api.dropboxapi.com/2/sharing/list_shared_links";

  try {
    const response = await fetch(listLinksUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: path,
      }),
    });

    // Clone the response so we can read it multiple times if needed
    const clonedResponse = response.clone();

    if (!response.ok) {
      let errorMessage = `Failed to get shared links: Status ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = `Failed to get shared links: ${errorData.error_summary || JSON.stringify(errorData)}`;
      } catch (jsonError) {
        try {
          const errorText = await clonedResponse.text();
          errorMessage = `Failed to get shared links: ${errorText || "Unknown error"}`;
        } catch (textError) {
          console.error("Could not read error response", textError);
        }
      }

      throw new Error(errorMessage);
    }

    try {
      const data = await response.json();
      if (data.links && data.links.length > 0) {
        return data.links[0].url;
      }
      throw new Error("No shared links found");
    } catch (parseError) {
      console.error("Error parsing list_shared_links response:", parseError);
      throw new Error(`Error parsing Dropbox response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error getting existing shared link:", error);
    throw error;
  }
}

/**
 * Delete a file or folder in Dropbox
 * @param {string} accessToken - Dropbox access token
 * @param {string} path - The path to the file or folder
 * @returns {Promise<Object>} The deletion response
 */
export async function deleteFile(accessToken, path) {
  const deleteUrl = "https://api.dropboxapi.com/2/files/delete_v2";

  try {
    const response = await fetch(deleteUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: path,
      }),
    });

    // Clone the response so we can read it multiple times if needed
    const clonedResponse = response.clone();

    if (!response.ok) {
      let errorMessage = `Failed to delete file: Status ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = `Failed to delete file: ${errorData.error_summary || JSON.stringify(errorData)}`;
      } catch (jsonError) {
        try {
          const errorText = await clonedResponse.text();
          errorMessage = `Failed to delete file: ${errorText || "Unknown error"}`;
        } catch (textError) {
          console.error("Could not read error response", textError);
        }
      }

      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch (parseError) {
      console.error("Error parsing delete response:", parseError);
      throw new Error(`Error parsing Dropbox response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in deleteFile:", error);
    throw error;
  }
}

/**
 * List files and folders in a Dropbox folder
 * @param {string} accessToken - Dropbox access token
 * @param {string} path - The path to list
 * @returns {Promise<Array>} The list of files and folders
 */
export async function listFolder(accessToken, path) {
  const listFolderUrl = "https://api.dropboxapi.com/2/files/list_folder";

  const response = await fetch(listFolderUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: path === "/" ? "" : path,
      recursive: false,
      include_media_info: true,
      include_deleted: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to list folder: ${errorData.error_summary || "Unknown error"}`,
    );
  }

  return response.json();
}
