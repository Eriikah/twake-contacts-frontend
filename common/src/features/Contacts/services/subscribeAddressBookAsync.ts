import { RejectedError, toRejectedError } from '@common/utils/errorUtils'
import { ReducerCreators } from '@reduxjs/toolkit'
import { subscribeToAddressBook } from '../ContactsDao'
import { AddressBook, ContactsState } from '../contactsTypes'
import { toContactsErrorKey } from '../contactsUtils'

export interface SubscribeAddressBookArgs {
  userId: string
  source: AddressBook
  ownerDisplayName?: string
}

export const subscribeAddressBookThunk = (
  create: ReducerCreators<ContactsState>
) =>
  create.asyncThunk<
    AddressBook,
    SubscribeAddressBookArgs,
    { rejectValue: RejectedError }
  >(
    async ({ userId, source, ownerDisplayName }, { rejectWithValue }) => {
      try {
        return await subscribeToAddressBook(userId, source, ownerDisplayName)
      } catch (err: unknown) {
        return rejectWithValue(toRejectedError(err))
      }
    },
    {
      fulfilled: (state, action) => {
        const book = action.payload
        state.addressBooks[book.id] = {
          ...book,
          contacts: [],
          offset: 0,
          hasMore: true
        }
      },
      rejected: (state, action) => {
        state.error = toContactsErrorKey(
          action.payload,
          'contacts.errors.subscribe'
        )
      }
    }
  )
