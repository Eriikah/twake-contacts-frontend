import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { TwakeMuiThemeProvider } from '@linagora/twake-mui'
import I18n from 'twake-i18n'
import { setupStore } from '@common/app/store'
import {
  fetchAddressBookDetails,
  resolveAddressBookMember,
  updateAddressBookShares
} from '@common/features/Contacts/ContactsDao'
import { AddressBookAccessLevel } from '@common/features/Contacts/davTypes'
import { searchUsers } from '@common/features/User/UserDao'
import { UserState } from '@common/features/User/UserSlice'
import { userData } from '@common/features/User/userDataTypes'
import en from '@common/locales/en.json'
import { ShareAddressBookDialog } from './ShareAddressBookDialog'

jest.mock('@common/features/Contacts/ContactsDao')
jest.mock('@common/features/User/UserDao', () => ({
  searchUsers: jest.fn()
}))

const mockedFetchDetails = fetchAddressBookDetails as jest.MockedFunction<
  typeof fetchAddressBookDetails
>
const mockedUpdateShares = updateAddressBookShares as jest.MockedFunction<
  typeof updateAddressBookShares
>
const mockedResolveMember = resolveAddressBookMember as jest.MockedFunction<
  typeof resolveAddressBookMember
>
const mockedSearchUsers = searchUsers as jest.MockedFunction<typeof searchUsers>

const bob = {
  openpaasId: 'bob',
  name: 'bob bob',
  email: 'bob@open-paas.org',
  role: AddressBookAccessLevel.Viewer
} as userData

function renderShareDialog(): void {
  const store = setupStore({
    user: {
      userData: {
        openpaasId: 'alice',
        name: 'alice alice',
        email: 'alice@open-paas.org'
      }
    } as UserState,
    contacts: {
      addressBooks: {
        book1: {
          id: 'book1',
          userId: 'alice',
          name: 'Friends',
          contactsCount: 0,
          acl: [],
          canWrite: true,
          contacts: []
        }
      },
      listings: {},
      loading: false,
      error: null
    }
  })
  render(
    <Provider store={store}>
      <TwakeMuiThemeProvider>
        <I18n dictRequire={() => en} lang="en">
          <ShareAddressBookDialog addressBookId="book1" onClose={jest.fn()} />
        </I18n>
      </TwakeMuiThemeProvider>
    </Provider>
  )
}

describe('ShareAddressBookDialog', () => {
  beforeEach(() => mockedResolveMember.mockImplementation(async m => m))
  afterEach(() => jest.resetAllMocks())

  it('lists a member whose profile lookup has not answered yet', async () => {
    const invitedBob = { ...bob, name: bob.email } as userData
    mockedFetchDetails.mockResolvedValue({
      members: [invitedBob],
      isPublic: false
    })
    mockedResolveMember.mockReturnValue(new Promise(() => undefined))
    renderShareDialog()

    expect(
      await screen.findByRole('button', { name: 'Role of bob@open-paas.org' })
    ).toBeInTheDocument()
    expect(
      screen.queryByText('No one has been added yet')
    ).not.toBeInTheDocument()
  })

  it('reports in the dialog a failure to fetch the members', async () => {
    mockedFetchDetails.mockRejectedValue(new Error('Bad Request'))
    renderShareDialog()

    expect(
      await screen.findByText('Failed to load the members of this address book')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('No one has been added yet')
    ).not.toBeInTheDocument()
  })

  it('lists the members once they are fetched after a failure', async () => {
    mockedFetchDetails
      .mockRejectedValueOnce(new Error('Bad Request'))
      .mockResolvedValue({ members: [bob], isPublic: false })
    mockedUpdateShares.mockResolvedValue(undefined)
    mockedSearchUsers.mockResolvedValue([
      {
        id: 'bob',
        firstname: 'bob',
        lastname: 'bob',
        emails: ['bob@open-paas.org']
      }
    ])
    renderShareDialog()

    expect(
      await screen.findByText('Failed to load the members of this address book')
    ).toBeInTheDocument()
    userEvent.type(screen.getByPlaceholderText('Add contacts'), 'bob')
    await waitFor(() => expect(mockedSearchUsers).toHaveBeenCalled())
    userEvent.click(await screen.findByText('bob@open-paas.org'))
    userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('bob bob')).toBeInTheDocument()
    expect(
      screen.queryByText('Failed to load the members of this address book')
    ).not.toBeInTheDocument()
  })

  it('lists a member shared again right after being removed', async () => {
    mockedFetchDetails
      .mockResolvedValueOnce({ members: [bob], isPublic: false })
      .mockResolvedValueOnce({ members: [], isPublic: false })
      .mockResolvedValueOnce({ members: [bob], isPublic: false })
    mockedUpdateShares.mockResolvedValue(undefined)
    mockedSearchUsers.mockResolvedValue([
      {
        id: 'bob',
        firstname: 'bob',
        lastname: 'bob',
        emails: ['bob@open-paas.org']
      }
    ])
    renderShareDialog()

    userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(mockedFetchDetails).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('bob bob')).not.toBeInTheDocument()

    userEvent.type(screen.getByPlaceholderText('Add contacts'), 'bob')
    await waitFor(() => expect(mockedSearchUsers).toHaveBeenCalled())
    userEvent.click(await screen.findByText('bob@open-paas.org'))
    userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('bob bob')).toBeInTheDocument()
    expect(mockedFetchDetails).toHaveBeenCalledTimes(3)
  })

  it('gives the focus back to the role selector after changing a role', async () => {
    mockedFetchDetails.mockResolvedValue({ members: [bob], isPublic: false })
    mockedUpdateShares.mockResolvedValue(undefined)
    renderShareDialog()

    const roleSelector = await screen.findByRole('button', {
      name: 'Role of bob bob'
    })
    userEvent.click(roleSelector)
    userEvent.click(screen.getByRole('menuitemradio', { name: 'Editor' }))

    expect(roleSelector).toBeDisabled()
    // Browsers drop the focus of a disabled element, jsdom does not
    act(() => roleSelector.blur())
    expect(roleSelector).not.toHaveFocus()
    await waitFor(() => expect(roleSelector).toHaveFocus())
    expect(roleSelector).toBeEnabled()
    expect(mockedUpdateShares).toHaveBeenCalled()
  })

  it('moves the focus to the "Add contacts" field after removing a member', async () => {
    mockedFetchDetails
      .mockResolvedValueOnce({ members: [bob], isPublic: false })
      .mockResolvedValue({ members: [], isPublic: false })
    mockedUpdateShares.mockResolvedValue(undefined)
    renderShareDialog()

    userEvent.click(await screen.findByRole('button', { name: 'Remove' }))

    expect(screen.queryByText('bob bob')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Add contacts')).toHaveFocus()
  })
})
