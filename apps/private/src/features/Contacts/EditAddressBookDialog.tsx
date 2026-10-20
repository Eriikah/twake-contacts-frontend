import React, { useState } from 'react'
import { AddressBook } from '@common/features/Contacts/contactsTypes'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@linagora/twake-mui'
import { useI18n } from 'twake-i18n'

export interface EditAddressBookDialogProps {
  book: AddressBook
  onClose: () => void
  onConfirm: (values: { name: string }) => void
}

export const EditAddressBookDialog: React.FC<EditAddressBookDialogProps> = ({
  book,
  onClose,
  onConfirm
}) => {
  const { t } = useI18n()
  const [name, setName] = useState(book.name ?? '')

  const trimmedName = name.trim()

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('contacts.edit.title')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={t('contacts.edit.name')}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('contacts.edit.cancel')}</Button>
        <Button
          variant="contained"
          disabled={!trimmedName}
          onClick={() => onConfirm({ name: trimmedName })}
        >
          {t('contacts.edit.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
