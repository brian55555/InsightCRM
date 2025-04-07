// Contacts List Component (pages/contacts/ContactsList.jsx)
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import ContactsIcon from "@mui/icons-material/Contacts";
import Dropzone from "react-dropzone";
import supabase from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function ContactsList({ businessId }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [businessCardPreview, setBusinessCardPreview] = useState(null);
  const [businessCardFile, setBusinessCardFile] = useState(null);
  const [currentContact, setCurrentContact] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    business_id: businessId || "",
    notes: "",
    business_card_url: "",
  });

  useEffect(() => {
    fetchContacts();
    if (!businessId) {
      fetchBusinesses();
    }
  }, [businessId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("contacts")
        .select(
          `
          *,
          businesses:business_id (id, name)
        `,
        )
        .order("name");

      if (businessId) {
        query = query.eq("business_id", businessId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
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

  const handleDialogOpen = (contact = null) => {
    if (contact) {
      setCurrentContact(contact);
      if (contact.business_card_url) {
        setBusinessCardPreview(contact.business_card_url);
      } else {
        setBusinessCardPreview(null);
      }
    } else {
      setCurrentContact({
        name: "",
        title: "",
        email: "",
        phone: "",
        business_id: businessId || "",
        notes: "",
        business_card_url: "",
      });
      setBusinessCardPreview(null);
    }
    setBusinessCardFile(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDeleteDialogOpen = (contact) => {
    setCurrentContact(contact);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentContact({
      ...currentContact,
      [name]: value,
    });
  };

  const handleBusinessCardDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setBusinessCardFile(file);
      setBusinessCardPreview(URL.createObjectURL(file));
    }
  };

  const uploadBusinessCard = async (file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `business-cards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("contact-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("contact-attachments")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading business card:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!currentContact.name || !currentContact.business_id) {
        alert("Name and Business are required fields");
        return;
      }

      let businessCardUrl = currentContact.business_card_url;

      // Upload business card if provided
      if (businessCardFile) {
        businessCardUrl = await uploadBusinessCard(businessCardFile);
      }

      const isEditing = !!currentContact.id;

      if (isEditing) {
        // Log old values before updating
        const oldContact = contacts.find((c) => c.id === currentContact.id);

        // Update existing contact
        const { error } = await supabase
          .from("contacts")
          .update({
            name: currentContact.name,
            title: currentContact.title,
            email: currentContact.email,
            phone: currentContact.phone,
            business_id: currentContact.business_id,
            notes: currentContact.notes,
            business_card_url: businessCardUrl,
            updated_at: new Date(),
          })
          .eq("id", currentContact.id);

        if (error) throw error;

        // Log the change
        await supabase.from("change_logs").insert([
          {
            table_name: "contacts",
            record_id: currentContact.id,
            field_name: "multiple fields",
            old_value: JSON.stringify(oldContact),
            new_value: JSON.stringify({
              ...currentContact,
              business_card_url: businessCardUrl,
            }),
            changed_by: user.id,
            changed_at: new Date(),
          },
        ]);
      } else {
        // Create new contact
        const { data, error } = await supabase
          .from("contacts")
          .insert([
            {
              name: currentContact.name,
              title: currentContact.title,
              email: currentContact.email,
              phone: currentContact.phone,
              business_id: currentContact.business_id,
              notes: currentContact.notes,
              business_card_url: businessCardUrl,
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
              table_name: "contacts",
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

      // Refresh contacts
      fetchContacts();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Error saving contact. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", currentContact.id);

      if (error) throw error;

      // Log the deletion
      await supabase.from("change_logs").insert([
        {
          table_name: "contacts",
          record_id: currentContact.id,
          field_name: "deletion",
          old_value: JSON.stringify(currentContact),
          new_value: null,
          changed_by: user.id,
          changed_at: new Date(),
        },
      ]);

      setContacts(contacts.filter((c) => c.id !== currentContact.id));
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error deleting contact. Please try again.");
    }
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
          {businessId ? "Business Contacts" : "All Contacts"}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add Contact
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading contacts...</Typography>
      ) : contacts.length === 0 ? (
        <Typography>No contacts found</Typography>
      ) : (
        <Grid container spacing={3}>
          {contacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {contact.business_card_url && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={contact.business_card_url}
                    alt={`${contact.name}'s business card`}
                    sx={{ objectFit: "contain", bgcolor: "#f5f5f5" }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography variant="h6" component="h2">
                        {contact.name}
                      </Typography>
                      {contact.title && (
                        <Typography variant="body2" color="text.secondary">
                          {contact.title}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(contact)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDialogOpen(contact)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {!businessId && contact.businesses && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {contact.businesses.name}
                      </Typography>
                    </Box>
                  )}

                  {contact.email && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </Typography>
                    </Box>
                  )}

                  {contact.phone && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                      </Typography>
                    </Box>
                  )}

                  {contact.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {contact.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Contact Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentContact.id ? "Edit Contact" : "Add New Contact"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="name"
              label="Contact Name"
              value={currentContact.name}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              fullWidth
              name="title"
              label="Job Title"
              value={currentContact.title || ""}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={currentContact.email || ""}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              fullWidth
              name="phone"
              label="Phone Number"
              value={currentContact.phone || ""}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              required
              select
              fullWidth
              name="business_id"
              label="Business"
              value={currentContact.business_id}
              onChange={handleInputChange}
              disabled={!!businessId}
            >
              {!businessId &&
                businesses.map((business) => (
                  <MenuItem key={business.id} value={business.id}>
                    {business.name}
                  </MenuItem>
                ))}
              {businessId && (
                <MenuItem value={businessId}>
                  {businesses.find((b) => b.id === businessId)?.name ||
                    "Current Business"}
                </MenuItem>
              )}
            </TextField>

            <TextField
              margin="normal"
              fullWidth
              name="notes"
              label="Notes"
              multiline
              rows={3}
              value={currentContact.notes || ""}
              onChange={handleInputChange}
            />

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Business Card Image
            </Typography>

            <Dropzone
              onDrop={handleBusinessCardDrop}
              accept={{ "image/*": [] }}
            >
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
                  <Typography>
                    {businessCardPreview
                      ? "Change business card image"
                      : "Drag and drop a business card image, or click to select a file"}
                  </Typography>
                </Box>
              )}
            </Dropzone>

            {businessCardPreview && (
              <Box
                sx={{
                  mt: 2,
                  textAlign: "center",
                  "& img": {
                    maxWidth: "100%",
                    maxHeight: 200,
                    objectFit: "contain",
                  },
                }}
              >
                <img src={businessCardPreview} alt="Business card preview" />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {currentContact.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Contact</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {currentContact.name}? This action
            cannot be undone.
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
