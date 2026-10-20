import { useAppDispatch, useAppSelector } from '@common/app/hooks'
import { createContact } from '@common/features/Contacts/ContactsSlice'
import { DEFAULT_ADDRESS_BOOK_ID } from '@common/features/Contacts/constants'
import { selectWritableBooks } from '@common/features/Contacts/contactsSelectors'
import { isHiddenAddressBook } from '@common/features/Contacts/contactsUtils'
import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  SHARED_CONTACT_PARAM,
  parseSharedContact
} from '@/features/Contacts/sharedContact'
import { useI18n } from 'twake-i18n'
import {
  ContactForm,
  ContactFormValues,
  EMPTY_CONTACT_FORM_VALUES,
  makeContactFromForm
} from './ContactForm'
import { ContactFormSkeleton } from './ContactSkeletons'

export const CreateContactPage: React.FC = () => {
  const { t } = useI18n()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { addressBookId } = useParams()
  const [searchParams] = useSearchParams()
  const shared = useMemo(
    () => parseSharedContact(searchParams.get(SHARED_CONTACT_PARAM)),
    [searchParams]
  )
  console.log(shared)
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const writableBooks = useAppSelector(selectWritableBooks)
  const loading = useAppSelector(state => state.contacts.loading)

  if (loading && writableBooks.length === 0) {
    return <ContactFormSkeleton />
  }

  const initialValues: ContactFormValues = {
    ...EMPTY_CONTACT_FORM_VALUES,
    ...(shared ? shared : {}),
    addressBookId: writableBooks.some(book => book.id === addressBookId)
      ? (addressBookId ?? DEFAULT_ADDRESS_BOOK_ID)
      : DEFAULT_ADDRESS_BOOK_ID
  }

  const backTo =
    initialValues.addressBookId &&
    !isHiddenAddressBook(initialValues.addressBookId)
      ? `/contacts/${initialValues.addressBookId}`
      : '/contacts'

  const handleSubmit = async (values: ContactFormValues): Promise<void> => {
    if (!openpaasId) return
    try {
      await dispatch(
        createContact({
          userId: openpaasId,
          addressBookId: values.addressBookId,
          contact: makeContactFromForm(values)
        })
      ).unwrap()
      void navigate(
        values.addressBookId && !isHiddenAddressBook(values.addressBookId)
          ? `/contacts/${values.addressBookId}`
          : '/contacts'
      )
    } catch {
      // error is surfaced by the contacts slice
    }
  }

  return (
    <ContactForm
      title={t('contacts.form.createTitle')}
      addressBooks={writableBooks}
      initialValues={initialValues}
      backTo={backTo}
      onSubmit={handleSubmit}
    />
  )
}
