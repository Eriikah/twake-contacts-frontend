import {
  Alert,
  CircularProgress,
  Container,
  Stack,
  Typography
} from '@linagora/twake-mui'
import { useAppDispatch, useAppSelector } from '@common/app/hooks'
import { fetchContacts } from '@common/features/Contacts/ContactsSlice'
import { useI18n } from 'twake-i18n'
import { useEffect } from 'react'
import { ContactsSidebar } from './ContactsSidebar'
import { ContactsTable } from './ContactsTable'

export const ContactsPage: React.FC = () => {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const contacts = useAppSelector(state =>
    Object.values(state.contacts.contactsByBook).flat()
  )
  const loading = useAppSelector(state => state.contacts.loading)
  const error = useAppSelector(state => state.contacts.error)

  useEffect(() => {
    if (openpaasId) {
      void dispatch(fetchContacts(openpaasId))
    }
  }, [openpaasId, dispatch])

  return (
    <Stack direction="row" spacing={2}>
      <ContactsSidebar />
      <Container component="main">
        <Typography variant="h4" gutterBottom>
          {t('contacts.myContacts')}
        </Typography>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && <ContactsTable contacts={contacts} />}
      </Container>
    </Stack>
  )
}
