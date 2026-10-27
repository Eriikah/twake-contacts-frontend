import { Button, Stack, Typography } from '@linagora/twake-mui'
import { useI18n } from 'twake-i18n'

interface ContactsLoadErrorStateProps {
  onRetry: () => void
}

/** A page of contacts that could not be loaded, with a way to load it again. */
export const ContactsLoadErrorState: React.FC<ContactsLoadErrorStateProps> = ({
  onRetry
}) => {
  const { t } = useI18n()

  return (
    <Stack spacing={1} className="u-flex-items-center u-p-1" role="alert">
      <Typography color="error">{t('contacts.errors.load')}</Typography>
      <Button variant="outlined" onClick={onRetry}>
        {t('error.retry')}
      </Button>
    </Stack>
  )
}
