import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@linagora/twake-mui'
import { Contact } from '@common/features/Contacts/contactsTypes'
import { useI18n } from 'twake-i18n'
import { ContactRow } from './ContactRow'

interface ContactsTableProps {
  contacts: Contact[]
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ contacts }) => {
  const { t } = useI18n()

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('contacts.name')}</TableCell>
            <TableCell>{t('contacts.email')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map(contact => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
