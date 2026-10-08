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
): AddressBookWithContacts {
  const previousLength = book.contacts.length
  const contacts = book.contacts.filter(contact => contact.id !== contactId)
  const wasRemoved = contacts.length < previousLength
  return {
    ...book,
    contacts,
    offset: wasRemoved ? Math.max(0, book.offset - 1) : book.offset,
    contactsCount:
      typeof book.contactsCount === 'number'
        ? book.contactsCount - 1
        : book.contactsCount
  }
}

function addOrReplaceContactInBook(
  book: AddressBookWithContacts,
  contact: Contact
): AddressBookWithContacts {
  const index = book.contacts.findIndex(c => c.id === contact.id)
  if (index !== -1) {
    const contacts = [...book.contacts]
    contacts[index] = contact
    return { ...book, contacts }
  }
  return {
    ...book,
    contacts: [...book.contacts, contact],
    contactsCount:
      typeof book.contactsCount === 'number'
        ? book.contactsCount + 1
        : book.contactsCount
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
      rejected: (state, action) => {
        state.error = action.payload?.message ?? 'Failed to move contact'
      }
    }
  )
