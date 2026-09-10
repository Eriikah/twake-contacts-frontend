import {
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@linagora/twake-mui'
import { Contacts, Icon, Plus } from '@linagora/twake-icons'
import { useAppSelector } from '@common/app/hooks'
import { useI18n } from 'twake-i18n'

export const ContactsSidebar: React.FC = () => {
  const { t } = useI18n()
  const addressBooks = useAppSelector(state => state.contacts.addressBooks)
  const otherBooks = addressBooks.filter(
    book => book.id !== 'collected' && book.id !== 'contacts'
  )
  return (
    <List component="nav">
      <ListItem>
        <Button variant="contained" fullWidth startIcon={<Icon icon={Plus} />}>
          {t('contacts.create')}
        </Button>
      </ListItem>
      <ListItem key={'myContacts'}>
        <ListItemButton selected>
          <ListItemIcon>
            <Icon icon={Contacts} />
          </ListItemIcon>
          <ListItemText primary={t('contacts.myContacts')} />
        </ListItemButton>
      </ListItem>
      {otherBooks.map(book => (
        <ListItem key={book.id}>
          <ListItemButton selected>
            <ListItemIcon>
              <Icon icon={Contacts} />
            </ListItemIcon>
            <ListItemText primary={book.name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}
