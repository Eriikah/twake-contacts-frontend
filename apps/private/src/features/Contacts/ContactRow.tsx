import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TableCell,
  TableRow
} from '@linagora/twake-mui'
import { Contact } from '@common/features/Contacts/contactsTypes'
import { getInitials } from './getInitials'

interface ContactRowProps {
  contact: Contact
}

export const ContactRow: React.FC<ContactRowProps> = ({ contact }) => (
  <TableRow hover>
    <TableCell>
      <ListItem disableGutters disablePadding>
        <ListItemAvatar>
          <Avatar size="s">{getInitials(contact.displayName)}</Avatar>
        </ListItemAvatar>
        <ListItemText primary={contact.displayName} />
      </ListItem>
    </TableCell>
    <TableCell>{contact.email}</TableCell>
  </TableRow>
)
