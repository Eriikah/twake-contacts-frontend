import { ReducerCreators } from '@reduxjs/toolkit'
import { RejectedError, toRejectedError } from '@common/utils/errorUtils'
import { moveContact } from '../ContactsDao'
import {
  AddressBookWithContacts,
  Contact,
  ContactsState
} from '../contactsTypes'

export interface MoveContactArgs {
  userId: string
  fromAddressBookId: string
  toAddressBookId: string
  contact: Contact
}

function removeContactFromBook(
  book: AddressBookWithContacts,
  contactId: string
): void {
  const previousLength = book.contacts.length
  book.contacts = book.contacts.filter(contact => contact.id !== contactId)
  if (book.contacts.length < previousLength) {
    book.offset = Math.max(0, book.offset - 1)
    if (typeof book.contactsCount === 'number') {
      book.contactsCount -= 1
    }
  }
}

function addOrReplaceContactInBook(
  book: AddressBookWithContacts,
  contact: Contact
): void {
  const index = book.contacts.findIndex(c => c.id === contact.id)
  if (index !== -1) {
    book.contacts[index] = contact
  } else {
    book.contacts.push(contact)
    if (typeof book.contactsCount === 'number') {
      book.contactsCount += 1
    }
  }
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
          removeContactFromBook(fromBook, action.payload.contact.id)
        }
        if (toBook) {
          addOrReplaceContactInBook(toBook, action.payload.contact)
        }
      },
      rejected: (state, action) => {
        state.error = action.payload?.message ?? 'Failed to move contact'
      }
    }
  )
