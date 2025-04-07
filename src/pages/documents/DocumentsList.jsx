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

      // Upload file to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documents${currentPath}${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          onUploadProgress: (progress) => {
            setUploadProgress(
              Math.round((progress.loaded / progress.total) * 50) + 10,
            );
          },
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Get the public URL
      const { data } = supabase.storage
        .from("business-documents")
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

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
            path: currentPath,
            google_drive_id: publicUrl, // Using this field to store the Supabase URL
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select();

      if (docError) throw docError;

      setUploadProgress(90);

      // Log the creation
      if (docData && docData[0]) {
        await supabase.from("change_logs").insert([
          {
            table_name: "documents",
            record_id: docData[0].id,
            field_name: "creation",
            old_value: null,
            new_value: JSON.stringify(docData[0]),
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
      alert("Error uploading file. Please try again.");
      setUploadProgress(0);
    }
  };

  const createFolder = async () => {
    try {
      if (!folderName) {
        alert("Folder name is required");
        return;
      }

      // In a real implementation, this would create a folder in Google Drive
      // For our mock implementation, we'll create a document with a special type

      const newPath = `${currentPath}${folderName}/`;

      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            name: folderName,
            type: "folder",
            path: currentPath,
            business_id: businessId || businesses[0]?.id,
            created_by: user.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select();

      if (error) throw error;

      // Log the creation
      if (data && data[0]) {
        await supabase.from("change_logs").insert([
          {
            table_name: "documents",
            record_id: data[0].id,
            field_name: "creation",
            old_value: null,
            new_value: JSON.stringify(data[0]),
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
      alert("Error creating folder. Please try again.");
    }
  };

  const deleteDocument = async () => {
    try {
      if (!selectedItem) return;

      if (selectedItem.isFolder) {
        // In a real implementation, you would delete the folder and its contents in Google Drive
        // For our mock implementation, we'll just refresh the list
        fetchDocuments();
        handleDeleteDialogClose();
        return;
      }

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", selectedItem.id);

      if (error) throw error;

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

      // If there was a file in storage, delete it too
      if (selectedItem.google_drive_id) {
        // Extract the filename from the URL
        const url = new URL(selectedItem.google_drive_id);
        const pathParts = url.pathname.split("/");
        const fileName = pathParts[pathParts.length - 1];

        await supabase.storage
          .from("business-documents")
          .remove([`documents${currentPath}${fileName}`]);
      }

      // Refresh documents
      fetchDocuments();
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error deleting document. Please try again.");
    }
  };

  const downloadDocument = (item) => {
    if (item.google_drive_id) {
      window.open(item.google_drive_id, "_blank");
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
          {businessId ? "Business Documents" : "All Documents"}
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
          <Button onClick={deleteDocument} color="error">
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
              {selectedItem.type === "pdf" && selectedItem.google_drive_id ? (
                <iframe
                  src={selectedItem.google_drive_id}
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
                  src={selectedItem.google_drive_id}
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
