import {
  Avatar,
  Chip,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TableCell,
  TableRow
} from '@linagora/twake-mui'
import { Contact } from '@common/features/Contacts/contactsTypes'
import { useNavigate } from 'react-router-dom'
import { getInitials } from './getInitials'
import { useState } from 'react'
import { ContactRowActions } from './ContactRowActions'

interface ContactRowProps {
  contact: Contact
  addressBookId: string
  readOnly?: boolean
}

export const ContactRow: React.FC<ContactRowProps> = ({
  contact,
  addressBookId,
  readOnly
}) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (): void => {
    void navigate(`/contacts/${addressBookId}/${contact.id}`)
  }
  const handleMenuCellClick = (event: React.MouseEvent): void => {
    event.stopPropagation()
  }

  return (
    <TableRow
      hover
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TableCell>
        <ListItem disableGutters disablePadding>
          <ListItemAvatar>
            <Avatar size="s">{getInitials(contact.displayName)}</Avatar>
          </ListItemAvatar>
          <ListItemText primary={contact.displayName} />
        </ListItem>
      </TableCell>
      <TableCell>{contact.emails[0]?.value ?? '-'}</TableCell>
      <TableCell>{contact.phones?.[0]?.value ?? '-'}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={1}>
          {contact.categories?.map(category => (
            <Chip key={category} label={category} size="small" square />
          ))}
        </Stack>
      </TableCell>
      <TableCell align="right" onClick={handleMenuCellClick}>
        <ContactRowActions
          contact={contact}
          addressBookId={addressBookId}
          isHovered={isHovered}
          readOnly={readOnly}
        />
      </TableCell>
    </TableRow>
  )
}
