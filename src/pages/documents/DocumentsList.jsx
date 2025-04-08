// Documents Components

// Documents List Component (pages/documents/DocumentsList.js)
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Collapse from "@mui/material/Collapse";
import Menu from "@mui/material/Menu";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import CodeIcon from "@mui/icons-material/Code";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Document, Page } from "react-pdf";
import Dropzone from "react-dropzone";
import { format } from "date-fns";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  uploadDocument,
  createDocumentFolder,
  deleteDocument,
} from "../../utils/documentStorage";

// Document categories
const DOCUMENT_CATEGORIES = [
  "Contract",
  "Agreement",
  "Proposal",
  "Report",
  "Presentation",
  "Financial",
  "Legal",
  "Other",
];

export default function DocumentsList({ businessId }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");
  const [pathHistory, setPathHistory] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  const [folderName, setFolderName] = useState("");

  // Upload form state
  const [uploadData, setUploadData] = useState({
    name: "",
    description: "",
    category: "",
    business_id: businessId || "",
    file: null,
  });

  useEffect(() => {
    fetchDocuments();
    if (!businessId) {
      fetchBusinesses();
    }
  }, [businessId, currentPath]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      // This is a mock implementation for the document hierarchy
      // In a real implementation, you would integrate with Google Drive API
      // and manage folder structures appropriately

      // For demonstration, we'll simulate folders based on document paths
      let query = supabase.from("documents").select(`
          *,
          businesses:business_id (id, name),
          users:created_by (id, email, full_name)
        `);

      if (businessId) {
        query = query.eq("business_id", businessId);
      }

      // Filter by current path
      if (currentPath === "/") {
        // Only show root level documents
        query = query.or("path.is.null,path.eq./");
      } else {
        // Show documents in the current path
        query = query.eq("path", currentPath);
      }

      const { data, error } = await query.order("name");

      if (error) throw error;

      // Add simulated folders if there are documents in subdirectories
      const folderPaths = new Set();
      const allDocs = await supabase
        .from("documents")
        .select("path")
        .not("path", "is", null);

      if (!allDocs.error && allDocs.data) {
        allDocs.data.forEach((doc) => {
          if (
            doc.path &&
            doc.path.startsWith(currentPath) &&
            doc.path !== currentPath
          ) {
            // Get the next folder in the path
            const remainingPath = doc.path.slice(currentPath.length);
            const nextFolder = remainingPath.split("/")[1];
            if (nextFolder) {
              folderPaths.add(`${currentPath}${nextFolder}/`);
            }
          }
        });
      }

      const folders = Array.from(folderPaths).map((path) => {
        const folderName = path.split("/").filter(Boolean).pop();
        return {
          id: `folder-${folderName}`,
          name: folderName,
          type: "folder",
          path: path,
          isFolder: true,
        };
      });

      setDocuments([...folders, ...(data || [])]);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .order("name");

      if (error) throw error;

      setBusinesses(data || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const navigateToFolder = (path) => {
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(path);
  };

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory.pop();
      setPathHistory([...pathHistory]);
      setCurrentPath(previousPath);
    }
  };

  const handleMenuOpen = (event, item) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItem(null);
  };

  const handleUploadDialogOpen = () => {
    setUploadData({
      name: "",
      description: "",
      category: "",
      business_id: businessId || "",
      file: null,
    });
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setUploadProgress(0);
  };

  const handleCreateFolderDialogOpen = () => {
    setFolderName("");
    setCreateFolderDialogOpen(true);
  };

  const handleCreateFolderDialogClose = () => {
    setCreateFolderDialogOpen(false);
  };

  const handleDeleteDialogOpen = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handlePreviewDialogOpen = (item) => {
    setSelectedItem(item);
    setPreviewDialogOpen(true);
  };

  const handlePreviewDialogClose = () => {
    setPreviewDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData({
      ...uploadData,
      [name]: value,
    });
  };

  const handleFolderNameChange = (e) => {
    setFolderName(e.target.value);
  };

  const handleFileDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadData({
        ...uploadData,
        file,
        name: file.name,
      });
    }
  };

  const getFileTypeIcon = (filename) => {
    if (!filename) return <InsertDriveFileIcon />;

    const extension = filename.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return <PictureAsPdfIcon color="error" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon color="primary" />;
      case "doc":
      case "docx":
        return <DescriptionIcon color="primary" />;
      case "xls":
      case "xlsx":
        return <DescriptionIcon color="success" />;
      case "ppt":
      case "pptx":
        return <DescriptionIcon color="warning" />;
      case "js":
      case "html":
      case "css":
      case "json":
        return <CodeIcon color="secondary" />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  const handleExpandCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const uploadFile = async () => {
    try {
      const { file, name, description, category, business_id } = uploadData;

      if (!file || !name || !business_id) {
        alert("File name and business are required fields");
        return;
      }

      setUploadProgress(10);

      // Upload document using the documentStorage utility
      const result = await uploadDocument({
        file,
        name,
        description,
        category,
        business_id,
        path: currentPath,
        userId: user.id,
        progressCallback: (progress) => {
          setUploadProgress(Math.round(progress * 0.7) + 10); // Scale to 10-80%
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadProgress(90);

      // Log the creation
      if (result.document) {
        await supabase.from("change_logs").insert([
          {
            table_name: "documents",
            record_id: result.document.id,
            field_name: "creation",
            old_value: null,
            new_value: JSON.stringify(result.document),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      }

      setUploadProgress(100);

      // Refresh documents
      fetchDocuments();
      handleUploadDialogClose();
    } catch (error) {
      console.error("Error uploading file:", error);

      // Provide more specific error messages based on the error
      let errorMessage = "Error uploading file. ";

      if (error.message) {
        if (error.message.includes("Dropbox is not configured")) {
          errorMessage =
            "Dropbox is not properly configured. Please contact an administrator to set up the Dropbox integration.";
        } else if (
          error.message.includes("Network error") ||
          error.message.includes("timed out")
        ) {
          errorMessage =
            "Network error during upload. Please check your internet connection and try again.";
        } else if (
          error.message.includes("access_token") ||
          error.message.includes("authorization") ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Authorization error with Dropbox. The access token may have expired. Please contact an administrator.";
        } else if (
          error.message.includes("file size") ||
          error.message.includes("too large")
        ) {
          errorMessage =
            "The file is too large for upload. Please try a smaller file.";
        } else if (
          error.message.includes("path/not_found") ||
          error.message.includes("path/restricted")
        ) {
          errorMessage =
            "The folder path in Dropbox is not accessible. Please contact an administrator.";
        } else {
          // Include the actual error message for other cases
          errorMessage += error.message;
        }
      } else {
        errorMessage +=
          "Please try again or contact support if the issue persists.";
      }

      alert(errorMessage);
      setUploadProgress(0);
    }
  };

  const createFolder = async () => {
    try {
      if (!folderName) {
        alert("Folder name is required");
        return;
      }

      // Create folder using the documentStorage utility
      const result = await createDocumentFolder({
        folderName,
        currentPath,
        business_id: businessId || businesses[0]?.id,
        userId: user.id,
      });

      if (!result.success) {
        throw new Error(result.error || "Folder creation failed");
      }

      // Log the creation
      if (result.folder) {
        await supabase.from("change_logs").insert([
          {
            table_name: "documents",
            record_id: result.folder.id,
            field_name: "creation",
            old_value: null,
            new_value: JSON.stringify(result.folder),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      }

      // Refresh documents
      fetchDocuments();
      handleCreateFolderDialogClose();
    } catch (error) {
      console.error("Error creating folder:", error);

      // Provide more specific error messages based on the error
      let errorMessage = "Error creating folder: ";

      if (error.message) {
        if (error.message.includes("Dropbox is not configured")) {
          errorMessage =
            "Dropbox is not properly configured. Please contact an administrator to set up the Dropbox integration.";
        } else if (error.message.includes("path/conflict")) {
          errorMessage =
            "A folder with this name already exists in this location. Please choose a different name.";
        } else if (
          error.message.includes("access_token") ||
          error.message.includes("authorization") ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Authorization error with Dropbox. The access token may have expired. Please contact an administrator.";
        } else if (
          error.message.includes("path/not_found") ||
          error.message.includes("path/restricted")
        ) {
          errorMessage =
            "The folder path in Dropbox is not accessible. Please contact an administrator.";
        } else {
          // Include the actual error message for other cases
          errorMessage += error.message;
        }
      } else {
        errorMessage +=
          "Please try again or contact support if the issue persists.";
      }

      alert(errorMessage);
    }
  };

  const deleteDocumentItem = async () => {
    try {
      if (!selectedItem) return;

      if (selectedItem.isFolder) {
        // Delete folder using the documentStorage utility
        // This will be implemented in a future update
        // For now, we'll just refresh the list
        fetchDocuments();
        handleDeleteDialogClose();
        return;
      }

      // Delete document using the documentStorage utility
      const result = await deleteDocument({
        documentId: selectedItem.id,
        userId: user.id,
      });

      if (!result.success) {
        throw new Error(result.error || "Document deletion failed");
      }

      // Log the deletion
      await supabase.from("change_logs").insert([
        {
          table_name: "documents",
          record_id: selectedItem.id,
          field_name: "deletion",
          old_value: JSON.stringify(selectedItem),
          new_value: null,
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);

      // Refresh documents
      fetchDocuments();
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Error deleting document:", error);

      // Provide more specific error messages based on the error
      let errorMessage = "Error deleting document. ";

      if (error.message) {
        if (error.message.includes("Dropbox is not configured")) {
          errorMessage =
            "Dropbox is not properly configured. Please contact an administrator to set up the Dropbox integration.";
        } else if (
          error.message.includes("Network error") ||
          error.message.includes("timed out")
        ) {
          errorMessage =
            "Network error during deletion. Please check your internet connection and try again.";
        } else if (
          error.message.includes("access_token") ||
          error.message.includes("authorization") ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Authorization error with Dropbox. The access token may have expired. Please contact an administrator.";
        } else if (error.message.includes("path/not_found")) {
          errorMessage =
            "The file could not be found in Dropbox. It may have been moved or deleted already.";
        } else if (error.message.includes("path/restricted")) {
          errorMessage =
            "You don't have permission to delete this file. Please contact an administrator.";
        } else if (
          error.message.includes("too_many_requests") ||
          error.message.includes("429")
        ) {
          errorMessage =
            "Too many requests to Dropbox. Please wait a moment and try again.";
        } else if (error.message.includes("too_many_write_operations")) {
          errorMessage =
            "Too many write operations to Dropbox. Please wait a moment and try again.";
        } else {
          // Include the actual error message for other cases
          errorMessage += error.message;
        }
      } else {
        errorMessage +=
          "Please try again or contact support if the issue persists.";
      }

      alert(errorMessage);
    }
  };

  const downloadDocument = (item) => {
    if (item.dropbox_shared_url) {
      window.open(item.dropbox_shared_url, "_blank");
    } else if (item.google_drive_id) {
      window.open(item.google_drive_id, "_blank");
    } else {
      alert("Download link not available for this document.");
    }
  };

  const renderBreadcrumbs = () => {
    if (currentPath === "/") {
      return (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Home
        </Typography>
      );
    }

    const parts = currentPath.split("/").filter(Boolean);
    let currentBuildPath = "/";

    return (
      <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={navigateBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>

        <Typography
          variant="body2"
          sx={{ cursor: "pointer" }}
          onClick={() => {
            setPathHistory([...pathHistory, currentPath]);
            setCurrentPath("/");
          }}
        >
          Home
        </Typography>

        {parts.map((part, index) => {
          currentBuildPath += `${part}/`;
          return (
            <React.Fragment key={index}>
              <Typography variant="body2" sx={{ mx: 0.5 }}>
                /
              </Typography>
              <Typography
                variant="body2"
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (currentBuildPath !== currentPath) {
                    setPathHistory([...pathHistory, currentPath]);
                    setCurrentPath(currentBuildPath);
                  }
                }}
              >
                {part}
              </Typography>
            </React.Fragment>
          );
        })}
      </Box>
    );
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">
          {businessId ? "" : "All Documents"}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CreateNewFolderIcon />}
            onClick={handleCreateFolderDialogOpen}
            sx={{ mr: 1 }}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadDialogOpen}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {renderBreadcrumbs()}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" gutterBottom>
            No documents found in this location
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadDialogOpen}
            sx={{ mt: 2 }}
          >
            Upload Document
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {documents.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      sx={{
                        cursor:
                          item.isFolder || item.type === "folder"
                            ? "pointer"
                            : "default",
                        width: "100%",
                      }}
                      onClick={() => {
                        if (item.isFolder) {
                          navigateToFolder(item.path);
                        } else if (item.type === "folder") {
                          navigateToFolder(`${currentPath}${item.name}/`);
                        }
                      }}
                    >
                      <Box mr={1}>
                        {item.isFolder || item.type === "folder" ? (
                          <FolderIcon color="primary" fontSize="large" />
                        ) : (
                          getFileTypeIcon(item.name)
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" noWrap>
                          {item.name}
                        </Typography>
                        {!item.isFolder &&
                          item.type !== "folder" &&
                          item.category && (
                            <Chip
                              label={item.category}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                      </Box>
                    </Box>

                    {!item.isFolder && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, item)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>

                {!item.isFolder && item.type !== "folder" && (
                  <>
                    <CardActions disableSpacing>
                      <Button
                        size="small"
                        startIcon={<CloudDownloadIcon />}
                        onClick={() => downloadDocument(item)}
                      >
                        Download
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ExpandMoreIcon />}
                        onClick={() => handleExpandCard(item.id)}
                        sx={{
                          transform:
                            expandedCard === item.id
                              ? "rotate(180deg)"
                              : "rotate(0)",
                          transition: "transform 0.3s",
                          ml: "auto",
                        }}
                      >
                        Details
                      </Button>
                    </CardActions>
                    <Collapse
                      in={expandedCard === item.id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <CardContent>
                        {item.description && (
                          <Typography variant="body2" paragraph>
                            {item.description}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Uploaded by:{" "}
                          {item.users?.full_name ||
                            item.users?.email ||
                            "Unknown"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Date:{" "}
                          {format(new Date(item.created_at), "MMM d, yyyy")}
                        </Typography>
                        {!businessId && item.businesses && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Business: {item.businesses.name}
                          </Typography>
                        )}
                      </CardContent>
                    </Collapse>
                  </>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Document action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedItem) handlePreviewDialogOpen(selectedItem);
          }}
        >
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Preview" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedItem) downloadDocument(selectedItem);
          }}
        >
          <ListItemIcon>
            <CloudDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedItem) handleDeleteDialogOpen(selectedItem);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Dropzone onDrop={handleFileDrop} multiple={false}>
            {({ getRootProps, getInputProps }) => (
              <Box
                {...getRootProps()}
                sx={{
                  border: "2px dashed #cccccc",
                  borderRadius: 1,
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  mb: 2,
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                <Typography>
                  {uploadData.file
                    ? `Selected: ${uploadData.file.name}`
                    : "Drag and drop a file here, or click to select a file"}
                </Typography>
              </Box>
            )}
          </Dropzone>

          {uploadProgress > 0 && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" gutterBottom>
                Upload Progress: {uploadProgress}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                color="primary"
              />
            </Box>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            name="name"
            label="Document Name"
            value={uploadData.name}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            fullWidth
            name="description"
            label="Description"
            multiline
            rows={3}
            value={uploadData.description || ""}
            onChange={handleInputChange}
          />

          <TextField
            margin="normal"
            select
            fullWidth
            name="category"
            label="Category"
            value={uploadData.category || ""}
            onChange={handleInputChange}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {DOCUMENT_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>

          {!businessId && (
            <TextField
              margin="normal"
              required
              select
              fullWidth
              name="business_id"
              label="Business"
              value={uploadData.business_id}
              onChange={handleInputChange}
            >
              {businesses.map((business) => (
                <MenuItem key={business.id} value={business.id}>
                  {business.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button
            onClick={uploadFile}
            variant="contained"
            disabled={
              !uploadData.file || !uploadData.name || uploadProgress > 0
            }
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderDialogOpen}
        onClose={handleCreateFolderDialogClose}
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            required
            fullWidth
            name="folderName"
            label="Folder Name"
            value={folderName}
            onChange={handleFolderNameChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateFolderDialogClose}>Cancel</Button>
          <Button
            onClick={createFolder}
            variant="contained"
            disabled={!folderName}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>
          Delete {selectedItem?.isFolder ? "Folder" : "Document"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedItem?.name}? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={deleteDocumentItem} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={handlePreviewDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedItem?.name}
          <IconButton
            aria-label="close"
            onClick={handlePreviewDialogClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            &times;
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Box sx={{ textAlign: "center" }}>
              {selectedItem.type === "pdf" &&
              (selectedItem.dropbox_shared_url ||
                selectedItem.google_drive_id) ? (
                <iframe
                  src={
                    selectedItem.dropbox_shared_url ||
                    selectedItem.google_drive_id
                  }
                  width="100%"
                  height="500px"
                  title={selectedItem.name}
                  frameBorder="0"
                />
              ) : selectedItem.type &&
                ["jpg", "jpeg", "png", "gif"].includes(
                  selectedItem.type.toLowerCase(),
                ) ? (
                <img
                  src={
                    selectedItem.dropbox_shared_url ||
                    selectedItem.google_drive_id
                  }
                  alt={selectedItem.name}
                  style={{ maxWidth: "100%", maxHeight: "500px" }}
                />
              ) : (
                <Box>
                  <Typography variant="body1">
                    Preview not available for this file type.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => downloadDocument(selectedItem)}
                    sx={{ mt: 2 }}
                  >
                    Download to View
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
