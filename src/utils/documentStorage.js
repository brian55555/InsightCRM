/**
 * Document Storage Utilities
 * This module handles document storage operations using Dropbox API
 */

import supabase from "../supabase";
import {
  uploadFile,
  createFolder,
  getSharedLink,
  deleteFile,
  listFolder,
} from "./dropbox.js";

/**
 * Upload a file to document storage
 * @param {Object} params - Upload parameters
 * @param {File} params.file - The file to upload
 * @param {string} params.name - Document name
 * @param {string} params.description - Document description
 * @param {string} params.category - Document category
 * @param {string} params.business_id - Business ID
 * @param {string} params.path - Current path in the folder structure
 * @param {string} params.userId - User ID who is uploading
 * @param {Function} params.progressCallback - Callback for upload progress
 * @returns {Promise<Object>} The upload result with document data
 */
export async function uploadDocument({
  file,
  name,
  description,
  category,
  business_id,
  path,
  userId,
  progressCallback,
}) {
  try {
    // Get Dropbox settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "dropbox_settings")
      .single();

    if (
      !settingsData ||
      !settingsData.value ||
      !settingsData.value.access_token
    ) {
      throw new Error(
        "Dropbox is not configured. Please set up Dropbox integration first.",
      );
    }

    const accessToken = settingsData.value.access_token;
    const rootFolder = settingsData.value.root_folder_path || "/";

    // Create the full path for the file
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const dropboxPath = `${rootFolder}${path === "/" ? "" : path}${fileName}`;

    try {
      // Upload file to Dropbox
      const uploadResult = await uploadFile(
        accessToken,
        file,
        dropboxPath,
        progressCallback,
      );

      // Get a shared link for the file
      let sharedLink;
      try {
        sharedLink = await getSharedLink(accessToken, dropboxPath);
      } catch (linkError) {
        console.error("Error getting shared link, using fallback:", linkError);
        // Use a fallback URL if we can't get a shared link
        sharedLink = `https://www.dropbox.com/home${dropboxPath}`;
      }

      // Create document record in database
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert([
          {
            name,
            description,
            category,
            business_id,
            type: fileExt,
            path,
            google_drive_id: sharedLink, // For backward compatibility
            dropbox_id: uploadResult.id,
            dropbox_path: dropboxPath,
            dropbox_shared_url: sharedLink,
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select();

      if (docError) throw docError;

      return { success: true, document: docData[0] };
    } catch (uploadError) {
      console.error("Error in upload process:", uploadError);
      // Try to clean up the file if it was uploaded but we failed at a later step
      try {
        if (dropboxPath) {
          await deleteFile(accessToken, dropboxPath);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up after failed upload:", cleanupError);
      }
      throw uploadError;
    }
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during upload",
      details: error.toString(),
    };
  }
}

/**
 * Create a folder in document storage
 * @param {Object} params - Folder creation parameters
 * @param {string} params.folderName - Name of the folder to create
 * @param {string} params.currentPath - Current path in the folder structure
 * @param {string} params.business_id - Business ID
 * @param {string} params.userId - User ID who is creating the folder
 * @returns {Promise<Object>} The creation result with folder data
 */
export async function createDocumentFolder({
  folderName,
  currentPath,
  business_id,
  userId,
}) {
  try {
    // Get Dropbox settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "dropbox_settings")
      .single();

    if (
      !settingsData ||
      !settingsData.value ||
      !settingsData.value.access_token
    ) {
      throw new Error(
        "Dropbox is not configured. Please set up Dropbox integration first.",
      );
    }

    const accessToken = settingsData.value.access_token;
    const rootFolder = settingsData.value.root_folder_path || "/";

    // Create the full path for the folder
    const dropboxPath = `${rootFolder}${currentPath === "/" ? "" : currentPath}${folderName}`;

    // Create folder in Dropbox
    await createFolder(accessToken, dropboxPath);

    // Create folder record in database
    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          name: folderName,
          type: "folder",
          path: currentPath,
          business_id,
          dropbox_path: dropboxPath,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .select();

    if (error) throw error;

    return { success: true, folder: data[0] };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a document or folder from storage
 * @param {Object} document - The document or folder to delete
 * @param {string} userId - User ID who is deleting
 * @returns {Promise<Object>} The deletion result
 */
export async function deleteDocument({ documentId, userId }) {
  try {
    if (!documentId)
      return { success: false, error: "No document ID specified" };

    // Get document details
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`);
    }

    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    // Get Dropbox settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "dropbox_settings")
      .single();

    if (
      !settingsData ||
      !settingsData.value ||
      !settingsData.value.access_token
    ) {
      throw new Error(
        "Dropbox is not configured. Please set up Dropbox integration first.",
      );
    }

    const accessToken = settingsData.value.access_token;

    // Delete from Dropbox if it has a path
    if (document.dropbox_path) {
      await deleteFile(accessToken, document.dropbox_path);
    }

    // Delete from database
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", document.id);

    if (error) throw error;

    // Log the deletion
    await supabase.from("change_logs").insert([
      {
        table_name: "documents",
        record_id: document.id,
        field_name: "deletion",
        old_value: JSON.stringify(document),
        new_value: null,
        changed_by: userId,
        changed_at: new Date(),
      },
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: error.message };
  }
}
