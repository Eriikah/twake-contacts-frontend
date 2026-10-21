import { Alert, Snackbar } from '@linagora/twake-mui'
import { useI18n } from 'twake-i18n'
import { useAppDispatch, useAppSelector } from '@common/app/hooks'
import { clearTransferSuccess } from '@common/features/Contacts/ContactsSlice'

export const ContactTransferSnackbar: React.FC = () => {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const success = useAppSelector(state => state.contacts.transferSuccess)
  const handleClose = (): void => {
    dispatch(clearTransferSuccess())
  }

  if (!success) return null

  return (
    <Snackbar
      key={success.requestId}
      open
      autoHideDuration={6000}
      onClose={(_event, reason) => {
        if (reason !== 'clickaway') handleClose()
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        variant="filled"
        severity="success"
        closeText={t('contacts.form.close')}
        onClose={handleClose}
      >
        {t('contacts.copyContact.success')}
      </Alert>
    </Snackbar>
  )
}
