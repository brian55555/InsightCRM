import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";

export default function ContactListItem({
  contact,
  businessId,
  onEdit,
  onDelete,
}) {
  return (
    <Card sx={{ mb: 2, bgcolor: "background.paper" }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box display="flex" alignItems="center" gap={2} width="100%">
            {contact.business_card_url ? (
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  overflow: "hidden",
                  borderRadius: 1,
                }}
              >
                <img
                  src={contact.business_card_url}
                  alt={`${contact.name}'s business card`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ) : (
              <Avatar sx={{ width: 60, height: 60, bgcolor: "primary.main" }}>
                {contact.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Box display="flex" justifyContent="space-between" width="100%">
                <Typography variant="h6" component="h2">
                  {contact.name}
                </Typography>
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
              {contact.title && (
                <Typography variant="body2" color="text.secondary">
                  {contact.title}
                </Typography>
              )}
              <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                {!businessId && contact.businesses && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {contact.businesses.name}
                    </Typography>
                  </Box>
                )}
                {contact.email && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon fontSize="small" color="action" />
                    <Box component="span">
                      <Typography component="span" variant="body2">
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </Typography>
                    </Box>
                  </Box>
                )}
                {contact.phone && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Box component="span">
                      <Typography component="span" variant="body2">
                        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
