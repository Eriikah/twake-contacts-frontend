import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { TwakeMuiThemeProvider } from '@linagora/twake-mui'
import I18n from 'twake-i18n'
import { setupStore } from '@common/app/store'
import { copyContact } from '@common/features/Contacts/ContactsDao'
import { copyContact as copyContactAction } from '@common/features/Contacts/ContactsSlice'
import { AddressBookWithContacts } from '@common/features/Contacts/contactsTypes'
import en from '@common/locales/en.json'
import { ContactTransferSnackbar } from './ContactTransferSnackbar'
import { ContactTransferDialog } from './CopyContactDialog'

jest.mock('@common/features/Contacts/ContactsDao')

const contact = { id: 'c1', displayName: 'Alice', emails: [] }
const book = (id: string, canWrite = true): AddressBookWithContacts => ({
  id,
  userId: `owner-${id}`,
  name: id,
  canWrite,
  acl: [],
  contactsCount: 0,
  contacts: []
})
const renderDialog = (
  sourceCanWrite = true
): {
  store: ReturnType<typeof setupStore>
  onClose: jest.Mock
} => {
  const store = setupStore({
    contacts: {
      addressBooks: {
        source: {
          ...book('source', sourceCanWrite),
          contacts: [contact],
          contactsCount: 1
        },
        target: book('target'),
        dab: book('dab'),
        readonly: book('readonly', false),
        contacts: { ...book('contacts'), name: 'My contacts' }
      },
      listings: {},
      loading: false,
      error: null
    }
  })
  const onClose = jest.fn()
  const DialogHarness = (): React.ReactElement => {
    const [open, setOpen] = useState(true)
    return (
      <>
        {open && (
          <ContactTransferDialog
            contact={contact}
            addressBookId="source"
            onClose={() => {
              onClose()
              setOpen(false)
            }}
          />
        )}
        <ContactTransferSnackbar />
      </>
    )
  }
  render(
    <Provider store={store}>
      <TwakeMuiThemeProvider>
        <I18n dictRequire={() => en} lang="en">
          <DialogHarness />
        </I18n>
      </TwakeMuiThemeProvider>
    </Provider>
  )
  return { store, onClose }
}
const selectDestination = (name = 'target'): void => {
  fireEvent.mouseDown(screen.getByRole('combobox'))
  expect(screen.queryByRole('option', { name: 'dab' })).not.toBeInTheDocument()
  expect(
    screen.queryByRole('option', { name: 'readonly' })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('option', { name: 'source' })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('option', { name }))
}

describe('CopyContactDialog', () => {
  beforeEach(() => jest.clearAllMocks())

  it('copies to a writable destination and preserves the source', async () => {
    jest.mocked(copyContact).mockResolvedValue('new-card-id')
    const { store, onClose } = renderDialog()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    selectDestination()
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.contacts.copyContact.success
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(store.getState().contacts.transferSuccess).toBeNull()
    expect(copyContact).toHaveBeenCalledWith(
      { userId: 'owner-source', addressBookId: 'source' },
      { userId: 'owner-target', addressBookId: 'target' },
      'c1'
    )
    expect(store.getState().contacts.addressBooks.source.contacts).toEqual([
      contact
    ])
    expect(store.getState().contacts.addressBooks.target.contacts).toEqual([
      { ...contact, id: 'new-card-id' }
    ])
    expect(store.getState().contacts.addressBooks.target.contactsCount).toBe(1)
  })

  it('keeps the dialog and destination unchanged when copying fails', async () => {
    jest.mocked(copyContact).mockRejectedValue(new Error('Copy failed'))
    const { store, onClose } = renderDialog()
    selectDestination()
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      en.contacts.copyContact.error
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(store.getState().contacts.transferSuccess).toBeUndefined()
    expect(store.getState().contacts.addressBooks.target.contacts).toEqual([])
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })
})

it('blocks copy from a read-only shared source before calling the API', async () => {
  jest.clearAllMocks()
  const { store } = renderDialog(false)
  selectDestination()
  expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
  const args = {
    fromAddressBookId: 'source',
    toAddressBookId: 'target',
    contact
  }
  const action = await store.dispatch(copyContactAction(args))
  expect(action.meta.requestStatus).toBe('rejected')
  expect(copyContact).not.toHaveBeenCalled()
  expect(store.getState().contacts.addressBooks.source.contacts).toEqual([
    contact
  ])
  expect(store.getState().contacts.addressBooks.target.contacts).toEqual([])
})

it('allows copy into My contacts', async () => {
  jest.clearAllMocks()
  jest.mocked(copyContact).mockResolvedValue('new-card-id')
  const { store, onClose } = renderDialog()
  selectDestination('My contacts')
  fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(copyContact).toHaveBeenCalledWith(
    { userId: 'owner-source', addressBookId: 'source' },
    { userId: 'owner-contacts', addressBookId: 'contacts' },
    'c1'
  )
  expect(store.getState().contacts.addressBooks.contacts.contacts).toEqual([
    { ...contact, id: 'new-card-id' }
  ])
  expect(store.getState().contacts.addressBooks.source.contacts).toEqual([
    contact
  ])
})
