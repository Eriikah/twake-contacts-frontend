import { Alert, Content, Layout, Main } from '@linagora/twake-mui'
import { useAppDispatch, useAppSelector } from '@common/app/hooks'
import { fetchContacts } from '@common/features/Contacts/ContactsSlice'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useI18n } from 'twake-i18n'
import { ContactsSidebar } from './ContactsSidebar'
import { ContactSearchBar } from './ContactSearchBar'

export const ContactsPage: React.FC = () => {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const domains = useAppSelector(state => state.user.userData.domains)
  const error = useAppSelector(state => state.contacts.error)
  useEffect(() => {
    if (openpaasId) {
      void dispatch(fetchContacts({ userId: openpaasId, domains }))
    }
  }, [openpaasId, domains, dispatch])

  return (
    <Layout withTopBar={false}>
      <ContactsSidebar />
      <Main>
        <Content className="u-p-1">
          <ContactSearchBar />
          {error && <Alert severity="error">{t(error)}</Alert>}
          <Outlet />
        </Content>
      </Main>
    </Layout>
  )
}
