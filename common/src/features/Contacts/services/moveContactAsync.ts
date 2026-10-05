import { ReducerCreators } from '@reduxjs/toolkit'
import { RejectedError, toRejectedError } from '@common/utils/errorUtils'
import { moveContact } from '../ContactsDao'
import { Contact, ContactsState } from '../contactsTypes'

export interface MoveContactArgs {
  userId: string
  fromAddressBookId: string
  toAddressBookId: string
  contact: Contact
}

export const moveContactThunk = (create: ReducerCreators<ContactsState>) =>
  create.asyncThunk<
    MoveContactArgs,
    MoveContactArgs,
    { rejectValue: RejectedError }
  >(
    async (args, { rejectWithValue }) => {
      try {
        await moveContact(
          args.userId,
          args.fromAddressBookId,
          args.toAddressBookId,
          args.contact
        )
        return args
      } catch (err) {
        return rejectWithValue(toRejectedError(err))
      }
    },
    {
      fulfilled: (state, action) => {
        const fromBook = state.addressBooks[action.payload.fromAddressBookId]
        const toBook = state.addressBooks[action.payload.toAddressBookId]
        if (fromBook) {
          const contacts = fromBook.contacts.filter(
            contact => contact.id !== action.payload.contact.id
          )
          if (contacts.length < fromBook.contacts.length) {
            fromBook.offset = Math.max(0, fromBook.offset - 1)
          }
          fromBook.contacts = contacts
          fromBook.contactsCount -= 1
        }
        if (toBook) {
          const exists = toBook.contacts.some(
            contact => contact.id === action.payload.contact.id
          )
          if (!exists) {
            toBook.contacts.push(action.payload.contact)
            toBook.contactsCount += 1
          }
        }
      },
      rejected: (state, action) => {
        state.error = action.payload?.message ?? 'Failed to move contact'
      }
    }
  )
