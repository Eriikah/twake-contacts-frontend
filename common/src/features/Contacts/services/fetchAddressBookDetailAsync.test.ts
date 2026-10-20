/** @jest-environment jsdom */
import reducer, { fetchAddressBookDetail } from '../ContactsSlice'
import { ContactsState } from '../contactsTypes'

const arg = { userId: 'owner', addressBookId: 'book' }
const initial: ContactsState = {
  addressBooks: {
    book: {
      id: 'book',
      userId: 'owner',
      name: 'Book',
      contactsCount: 0,
      acl: [],
      canWrite: true,
      contacts: [],
      offset: 0,
      hasMore: false
    }
  },
  loading: false,
  error: null
}

it('ignores an older detail response after the latest response', () => {
  let state = reducer(initial, fetchAddressBookDetail.pending('old', arg))
  state = reducer(state, fetchAddressBookDetail.pending('new', arg))
  state = reducer(
    state,
    fetchAddressBookDetail.fulfilled(
      { addressBookId: 'book', members: [], isPublic: true },
      'new',
      arg
    )
  )
  state = reducer(
    state,
    fetchAddressBookDetail.fulfilled(
      {
        addressBookId: 'book',
        members: [
          {
            email: 'stale@example.com',
            family_name: '',
            given_name: '',
            name: '',
            sid: '',
            sub: ''
          }
        ],
        isPublic: false
      },
      'old',
      arg
    )
  )
  expect(state.addressBooks.book.isPublic).toBe(true)
  expect(state.addressBooks.book.invitedMembers).toEqual([])
})

it('tracks requests independently for each address book', () => {
  let state = reducer(
    initial,
    fetchAddressBookDetail.pending('book-request', arg)
  )
  state = reducer(
    state,
    fetchAddressBookDetail.pending('other-request', {
      ...arg,
      addressBookId: 'other'
    })
  )
  state = reducer(
    state,
    fetchAddressBookDetail.fulfilled(
      { addressBookId: 'book', members: [], isPublic: true },
      'book-request',
      arg
    )
  )
  expect(state.addressBooks.book.isPublic).toBe(true)
})
