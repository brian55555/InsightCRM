// Notes List Component (pages/notes/NotesList.js)
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardActions from "@mui/material/CardActions";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { format } from "date-fns";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

// Note categories
const NOTE_CATEGORIES = [
  "General",
  "Meeting",
  "Call",
  "Email",
  "Task",
  "Idea",
  "Issue",
  "Other",
];

export default function NotesList({
  businessId,
  searchQuery = "",
  filterCategory = "All Categories",
  filterBusiness = "",
}) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorRef, setEditorRef] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    title: "",
    content: "",
    category: "General",
    business_id: businessId || "",
  });

  useEffect(() => {
    fetchNotes();
    if (!businessId) {
      fetchBusinesses();
    }
  }, [businessId]);

  useEffect(() => {
    if (dialogOpen) {
      // Small delay to ensure the DOM element is ready
      setTimeout(() => {
        const editorContainer = document.getElementById("editor-container");
        if (editorContainer && !editorRef) {
          const quill = new Quill("#editor-container", {
            theme: "snow",
            modules: {
              toolbar: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ["bold", "italic", "underline", "strike"],
                ["blockquote", "code-block"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ script: "sub" }, { script: "super" }],
                [{ indent: "-1" }, { indent: "+1" }],
                [{ color: [] }, { background: [] }],
                ["link", "image"],
                ["clean"],
              ],
            },
          });

          if (currentNote.content) {
            quill.clipboard.dangerouslyPasteHTML(currentNote.content);
          }

          setEditorRef(quill);
        }
      }, 100);
    } else {
      // Reset editor reference when dialog closes
      setEditorRef(null);
    }
  }, [dialogOpen, currentNote]);

  const fetchNotes = async () => {
    try {
      setLoading(true);

      let query = supabase.from("notes").select(`
          *,
          businesses:business_id (id, name),
          users:created_by (id, email, full_name)
        `);

      if (businessId) {
        query = query.eq("business_id", businessId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
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

  const handleMenuOpen = (event, note) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNote(note);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDialogOpen = (note = null) => {
    if (note) {
      setCurrentNote({
        ...note,
        content: note.content,
      });
    } else {
      setCurrentNote({
        title: "",
        content: "",
        category: "General",
        business_id: businessId || "",
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    // Editor reference will be reset in the useEffect
  };

  const handleDeleteDialogOpen = (note) => {
    setSelectedNote(note);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleViewDialogOpen = (note) => {
    setSelectedNote(note);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentNote({
      ...currentNote,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!currentNote.title || !currentNote.business_id) {
        alert("Title and business are required fields");
        return;
      }

      // Safely get content from editor
      let content = currentNote.content;
      if (editorRef && editorRef.root) {
        content = editorRef.root.innerHTML;
      }

      const isEditing = !!currentNote.id;

      if (isEditing) {
        // Log old values before updating
        const oldNote = notes.find((n) => n.id === currentNote.id);

        // Update existing note
        const { error } = await supabase
          .from("notes")
          .update({
            title: currentNote.title,
            content: content,
            category: currentNote.category,
            business_id: currentNote.business_id,
            updated_at: new Date(),
          })
          .eq("id", currentNote.id);

        if (error) throw error;

        // Log the change
        await supabase.from("change_logs").insert([
          {
            table_name: "notes",
            record_id: currentNote.id,
            field_name: "multiple fields",
            old_value: JSON.stringify(oldNote),
            new_value: JSON.stringify({
              ...currentNote,
              content,
            }),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      } else {
        // Create new note
        const { data, error } = await supabase
          .from("notes")
          .insert([
            {
              title: currentNote.title,
              content: content,
              category: currentNote.category,
              business_id: currentNote.business_id,
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
              table_name: "notes",
              record_id: data[0].id,
              field_name: "creation",
              old_value: null,
              new_value: JSON.stringify(data[0]),
              changed_by: user.id,
              changed_at: new Date(),
            },
          ]);
        }
      }

      // Refresh notes
      fetchNotes();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", selectedNote.id);

      if (error) throw error;

      // Log the deletion
      await supabase.from("change_logs").insert([
        {
          table_name: "notes",
          record_id: selectedNote.id,
          field_name: "deletion",
          old_value: JSON.stringify(selectedNote),
          new_value: null,
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);

      setNotes(notes.filter((n) => n.id !== selectedNote.id));
      handleDeleteDialogClose();
      handleMenuClose();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Error deleting note. Please try again.");
    }
  };

  // Function to strip HTML tags for preview
  const stripHtml = (html) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  // Filter notes based on search query, category, and business filter
  const filteredNotes = notes.filter((note) => {
    // Filter by search query (title or content)
    const matchesSearch = searchQuery
      ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stripHtml(note.content)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true;

    // Filter by category
    const matchesCategory =
      filterCategory === "All Categories" || note.category === filterCategory;

    // Filter by business
    let matchesBusiness = true;
    if (businessId) {
      // If we're already on a business page, no additional filtering needed
      matchesBusiness = true;
    } else if (filterBusiness === "recent") {
      // Filter for recently added (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesBusiness = new Date(note.created_at) >= sevenDaysAgo;
    } else if (filterBusiness === "none") {
      // Filter for no business assigned
      matchesBusiness = !note.business_id;
    } else if (filterBusiness) {
      // Filter for specific business
      matchesBusiness = note.business_id === filterBusiness;
    }

    return matchesSearch && matchesCategory && matchesBusiness;
  });

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">{businessId ? "" : "All Notes"}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add Note
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading notes...</Typography>
      ) : filteredNotes.length === 0 ? (
        <Typography>No notes found</Typography>
      ) : (
        <Box>
          {/* List View */}
          <Box sx={{ backgroundColor: "background.paper", borderRadius: 1 }}>
            {filteredNotes.map((note) => (
              <Box
                key={note.id}
                sx={{
                  p: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&:last-child": { borderBottom: "none" },
                  "&:hover": { backgroundColor: "action.hover" },
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box>
                    <Typography variant="h6" component="h2">
                      {note.title}
                    </Typography>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      mt={0.5}
                      mb={1}
                    >
                      <Chip
                        label={note.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {!businessId && note.businesses && (
                        <Typography variant="caption" color="text.secondary">
                          {note.businesses.name}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(note.created_at), "MMM d, yyyy")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        By:{" "}
                        {note.users?.full_name ||
                          note.users?.email ||
                          "Unknown"}
                      </Typography>
                    </Box>
                    <Box component="div">
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {stripHtml(note.content).length > 200
                          ? `${stripHtml(note.content).substring(0, 200)}...`
                          : stripHtml(note.content)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton
                      aria-label="note actions"
                      onClick={(e) => handleMenuOpen(e, note)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Box display="flex" gap={1} mt={1}>
                  <Button
                    size="small"
                    onClick={() => handleViewDialogOpen(note)}
                    variant="outlined"
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleDialogOpen(note)}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Note Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedNote) handleViewDialogOpen(selectedNote);
          }}
        >
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedNote) handleDialogOpen(selectedNote);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedNote) handleDeleteDialogOpen(selectedNote);
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Note Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentNote.id ? "Edit Note" : "Add New Note"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="title"
              label="Note Title"
              value={currentNote.title}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              select
              fullWidth
              name="category"
              label="Category"
              value={currentNote.category}
              onChange={handleInputChange}
            >
              {NOTE_CATEGORIES.map((category) => (
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
                value={currentNote.business_id}
                onChange={handleInputChange}
              >
                {businesses.map((business) => (
                  <MenuItem key={business.id} value={business.id}>
                    {business.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Note Content
            </Typography>

            <Box
              id="editor-container"
              sx={{
                height: 300,
                mb: 2,
                "& .ql-editor": {
                  minHeight: 200,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentNote.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleViewDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedNote?.title}
          <IconButton
            aria-label="close"
            onClick={handleViewDialogClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            &times;
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedNote && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip label={selectedNote.category} color="primary" />
                {!businessId && selectedNote.businesses && (
                  <Typography variant="body2" color="text.secondary">
                    Business: {selectedNote.businesses.name}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Created:{" "}
                  {format(new Date(selectedNote.created_at), "MMM d, yyyy")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  By:{" "}
                  {selectedNote.users?.full_name ||
                    selectedNote.users?.email ||
                    "Unknown"}
                </Typography>
              </Box>

              <Box
                dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                sx={{
                  "& img": {
                    maxWidth: "100%",
                    height: "auto",
                  },
                  "& pre": {
                    backgroundColor: "#f5f5f5",
                    padding: 2,
                    borderRadius: 1,
                    overflowX: "auto",
                  },
                  "& blockquote": {
                    borderLeft: "4px solid #ccc",
                    paddingLeft: 2,
                    margin: 0,
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              handleViewDialogClose();
              if (selectedNote) handleDialogOpen(selectedNote);
            }}
            color="primary"
          >
            Edit
          </Button>
          <Button onClick={handleViewDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this note? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
