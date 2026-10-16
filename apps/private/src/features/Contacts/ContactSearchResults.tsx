import { useAppDispatch, useAppSelector } from '@common/app/hooks'
import {
  addContactFromSearch,
  subscribeAddressBook
} from '@common/features/Contacts/ContactsSlice'
import {
  AddressBookRef,
  searchContacts
} from '@common/features/Contacts/ContactsDao'
import { ContactEntry } from '@common/features/Contacts/contactsTypes'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useI18n } from 'twake-i18n'
import { ContactsTable } from './ContactsTable'
import { UserSearchList } from './UserSearchList'
import { useUserSearch } from './useUserSearch'
import {
  AddressBook,
  UserResult
} from '@common/features/Contacts/contactsTypes'
import { Snackbar, Alert } from '@mui/material'

export const ContactSearchResults: React.FC = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const { users, loading: usersLoading } = useUserSearch(query)

  const addressBooksRecord = useAppSelector(
    state => state.contacts.addressBooks
  )
  const addressBookRefs = useMemo<AddressBookRef[]>(
    () =>
      Object.values(addressBooksRecord).map(book => ({
        userId: book.userId,
        addressBookId: book.id === 'dab' ? 'domain-members' : book.id
      })),
    [addressBooksRecord]
  )
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)

  const handleSubscribe = (user: UserResult, books: AddressBook[]): void => {
    if (isSubscribing || !openpaasId) return
    setIsSubscribing(true)
    const subscribe = async (): Promise<void> => {
      try {
        const results = await Promise.allSettled(
          books.map(source =>
            dispatch(
              subscribeAddressBook({
                userId: openpaasId,
                source,
                ownerDisplayName: user.displayName
              })
            ).unwrap()
          )
        )
        if (results.some(r => r.status === 'fulfilled')) {
          setSubscribeSuccess(true)
        }
      } finally {
        setIsSubscribing(false)
      }
    }
    void subscribe()
  }
  const [entries, setEntries] = useState<ContactEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (addressBookRefs.length === 0 || !query) {
      setEntries([])
      return
    }
    let cancelled = false
    setLoading(true)
    searchContacts(addressBookRefs, query)
      .then(result => !cancelled && setEntries(result))
      .catch(() => !cancelled && setEntries([]))
      .finally(() => !cancelled && setLoading(false))
    return (): void => {
      cancelled = true
    }
  }, [addressBookRefs, query])

  const handleSelect = (entry: ContactEntry): void => {
    const storeAddressBookId =
      entry.addressBookId === 'domain-members' ? 'dab' : entry.addressBookId
    dispatch(
      addContactFromSearch({
        addressBookId: storeAddressBookId,
        contact: entry.contact
      })
    )

    void navigate(`/contacts/${storeAddressBookId}/${entry.contact.id}`)
  }

  if (!loading && entries.length === 0) {
    return <div>{t('contacts.search.noResults')}</div>
  }

  return (
    <>
      <ContactsTable
        entries={entries}
        loading={loading}
        onEndReached={() => undefined}
        onSelect={handleSelect}
      />
      <UserSearchList
        key={query}
        users={users}
        loading={usersLoading}
        isSubscribing={isSubscribing}
        onSubscribe={handleSubscribe}
      />
      <Snackbar
        open={subscribeSuccess}
        autoHideDuration={6000}
        onClose={() => setSubscribeSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSubscribeSuccess(false)}>
          {t('contacts.addressBook.subscribeSuccess')}
        </Alert>
      </Snackbar>
    </>
  )
}
