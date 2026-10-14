import { Contact } from '@common/features/Contacts/contactsTypes'
import { Cross, Icon } from '@linagora/twake-icons'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  ListItem,
  Stack
} from '@linagora/twake-mui'
import { useI18n } from 'twake-i18n'
import { ContactPaper } from './ContactPaper'

interface DeleteContactDialogProps {
  contact: Contact
  onClose: () => void
  onConfirm: () => void
}

export const DeleteContactDialog: React.FC<DeleteContactDialogProps> = ({
  contact,
  onClose,
  onConfirm
}) => {
  const { t } = useI18n()
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <ListItem
          disableGutters
          disablePadding
          secondaryAction={
            <IconButton
              edge="end"
              aria-label={t('contacts.form.close')}
              onClick={onClose}
            >
              <Icon icon={Cross} />
            </IconButton>
          }
        >
          {t('contacts.delete.title')}
        </ListItem>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            {t('contacts.delete.description')}
          </DialogContentText>
          <ContactPaper contact={contact} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {t('contacts.form.cancel')}
        </Button>
        <Button variant="contained" onClick={onConfirm}>
          {t('contacts.delete.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
