import { ReducerCreators } from '@reduxjs/toolkit'
import { RejectedError, toRejectedError } from '@common/utils/errorUtils'
import { fetchAddressBooks, fetchContactsForBook } from '../ContactsDao'
import { Contact, ContactsState, AddressBook } from '../contactsTypes'

export const fetchContactsThunk = (create: ReducerCreators<ContactsState>) =>
  create.asyncThunk<
    { contactsByBook: Record<string, Contact[]>; books: AddressBook[] },
    string,
    { rejectValue: RejectedError }
  >(
    async (userId, { rejectWithValue }) => {
      try {
        const books = await fetchAddressBooks(userId)
        const contactsByBook: Record<string, Contact[]> = {}

        await Promise.all(
          books.map(async book => {
            contactsByBook[book.id] =
              book.contactsCount > 0
                ? await fetchContactsForBook(userId, book.id)
                : []
          })
        )

        return { contactsByBook, books }
      } catch (err) {
        return rejectWithValue(toRejectedError(err))
      }
    },
    {
      pending: state => {
        state.loading = true
        state.error = null
      },
      fulfilled: (state, action) => {
        state.loading = false
        state.contactsByBook = action.payload.contactsByBook
        state.addressBooks = action.payload.books
      },
      rejected: (state, action) => {
        state.loading = false
        if (action.payload?.status !== 401) {
          state.error = action.payload?.message ?? 'Failed to load contacts'
        }
      }
    }
  )
