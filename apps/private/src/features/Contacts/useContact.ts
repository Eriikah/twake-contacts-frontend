import { useAppDispatch, useAppSelector } from '@common/app/hooks'
import { fetchContact } from '@common/features/Contacts/ContactsSlice'
import { Contact } from '@common/features/Contacts/contactsTypes'
import { useEffect, useState } from 'react'

interface UseContactResult {
  contact?: Contact
  loading: boolean
}

// The store only holds the first pages of each book: a contact opened from a
// link or after a reload is fetched on its own when it is not there
export const useContact = (
  addressBookId: string,
  contactId?: string
): UseContactResult => {
  const dispatch = useAppDispatch()
  const booksLoading = useAppSelector(state => state.contacts.loading)
  const bookLoaded = useAppSelector(
    state => !!state.contacts.addressBooks[addressBookId]
  )
  const contact = useAppSelector(state =>
    state.contacts.addressBooks[addressBookId]?.contacts.find(
      c => c.id === contactId
    )
  )
  const contactKey = `${addressBookId}/${contactId}`
  // resolved once the contact was shown or its fetch settled: a contact that
  // leaves the store while shown was deleted or moved, not to be fetched again
  const [resolvedKey, setResolvedKey] = useState<string>()
  if (contact && resolvedKey !== contactKey) setResolvedKey(contactKey)

  const shouldFetch =
    !!contactId &&
    !booksLoading &&
    bookLoaded &&
    !contact &&
    resolvedKey !== contactKey

  useEffect(() => {
    if (!shouldFetch || !contactId) return
    void dispatch(fetchContact({ addressBookId, contactId })).finally(() =>
      setResolvedKey(contactKey)
    )
  }, [dispatch, shouldFetch, addressBookId, contactId, contactKey])

  return {
    contact,
    loading: booksLoading || shouldFetch
  }
}
