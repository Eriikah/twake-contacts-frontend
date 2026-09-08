import {
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@linagora/twake-mui'
import { Contacts, Icon, Plus } from '@linagora/twake-icons'
import { useI18n } from 'twake-i18n'

export const ContactsSidebar: React.FC = () => {
  const { t } = useI18n()

  return (
    <List component="nav">
      <ListItem>
        <Button variant="contained" fullWidth startIcon={<Icon icon={Plus} />}>
          {t('contacts.create')}
        </Button>
      </ListItem>
      <ListItem>
        <ListItemButton selected>
          <ListItemIcon>
            <Icon icon={Contacts} />
          </ListItemIcon>
          <ListItemText primary={t('contacts.myContacts')} />
        </ListItemButton>
      </ListItem>
    </List>
  )
}
