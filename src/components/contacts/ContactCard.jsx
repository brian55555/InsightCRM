import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";

export default function ContactCard({ contact, businessId, onEdit, onDelete }) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {contact.business_card_url ? (
        <CardMedia
          component="img"
          height="140"
          image={contact.business_card_url}
          alt={`${contact.name}'s business card`}
          sx={{ objectFit: "contain", bgcolor: "#f5f5f5" }}
        />
      ) : (
        <Box
          sx={{
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f5f5f5",
          }}
        >
          <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main" }}>
            {contact.name.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
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
              onClick={() => onEdit(contact)}
              aria-label="edit contact"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(contact)}
              aria-label="delete contact"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {!businessId && contact.businesses && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <BusinessIcon fontSize="small" color="action" />
            <Typography variant="body2">{contact.businesses.name}</Typography>
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
  );
}
