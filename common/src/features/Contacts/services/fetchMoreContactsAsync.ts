import { ReducerCreators } from '@reduxjs/toolkit'
import { RejectedError, toRejectedError } from '@common/utils/errorUtils'
import { ContactsState, Contact } from '../contactsTypes'
import { CONTACTS_PAGINATION_LIMIT } from '../constants'
import { fetchPaginatedContacts } from './fetchPaginatedContacts'

export interface FetchMoreContactsPayload {
  userId: string
  bookId: string
}

export const fetchMoreContactsThunk = (
  create: ReducerCreators<ContactsState>
) =>
  create.asyncThunk<
    { bookId: string; contacts: Contact[]; offset: number; hasMore: boolean },
    FetchMoreContactsPayload,
    { rejectValue: RejectedError }
  >(
    async ({ userId, bookId }, { getState, rejectWithValue }) => {
      try {
        const state = getState() as { contacts: ContactsState }
        const bookWithContacts = state.contacts.addressBooks[bookId]

        if (!bookWithContacts || !bookWithContacts.hasMore) {
          return {
            bookId,
            contacts: [],
            offset: bookWithContacts?.offset || 0,
            hasMore: false
          }
        }

        const result = await fetchPaginatedContacts(
          bookWithContacts,
          userId,
          CONTACTS_PAGINATION_LIMIT,
          bookWithContacts.offset
        )

        return {
          bookId,
          contacts: result.contacts,
          offset: result.offset,
          hasMore: result.hasMore
        }
      } catch (err) {
        return rejectWithValue(toRejectedError(err))
      }
    },
    {
      pending: () => {
        // Option: Add a loading state for fetching more contacts
      },
      fulfilled: (state, action) => {
        const { bookId, contacts, offset, hasMore } = action.payload
        if (state.addressBooks[bookId]) {
          state.addressBooks[bookId].contacts.push(...contacts)
          state.addressBooks[bookId].offset = offset
          state.addressBooks[bookId].hasMore = hasMore
        }
      },
      rejected: (state, action) => {
        if (action.payload?.status !== 401) {
          state.error =
            action.payload?.message ?? 'Failed to load more contacts'
        }
      }
    }
  )
