import { ReducerCreators } from '@reduxjs/toolkit'
import { RejectedError, toRejectedError } from '@common/utils/errorUtils'
import { fetchAddressBookDetails } from '../ContactsDao'
import { ContactsState } from '../contactsTypes'
import { toContactsErrorKey } from '../contactsUtils'
import { userData } from '@common/features/User/userDataTypes'

export interface FetchAddressBookDetailPayload {
  userId: string
  addressBookId: string
  silent?: boolean
}

export const fetchAddressBookDetailThunk = (
  create: ReducerCreators<ContactsState>
) =>
  create.asyncThunk<
    { addressBookId: string; members: userData[]; isPublic: boolean },
    FetchAddressBookDetailPayload,
    { rejectValue: RejectedError }
  >(
    async ({ userId, addressBookId }, { rejectWithValue }) => {
      try {
        const { members, isPublic } = await fetchAddressBookDetails(
          userId,
          addressBookId
        )
        return { addressBookId, members, isPublic }
      } catch (err) {
        return rejectWithValue(toRejectedError(err))
      }
    },
    {
      pending: (state, action) => {
        state.detailRequestIds ??= {}
        state.detailRequestIds[action.meta.arg.addressBookId] =
          action.meta.requestId
        if (!action.meta.arg.silent) {
          state.detailsLoading = true
        }
        state.error = null
      },
      fulfilled: (state, action) => {
        if (!action.meta.arg.silent) {
          state.detailsLoading = false
        }
        const { addressBookId, members, isPublic } = action.payload
        if (
          state.detailRequestIds?.[addressBookId] === action.meta.requestId &&
          state.addressBooks[addressBookId]
        ) {
          state.addressBooks[addressBookId] = {
            ...state.addressBooks[addressBookId],
            invitedMembers: members,
            isPublic
          }
        }
      },
      rejected: (state, action) => {
        if (!action.meta.arg.silent) {
          state.detailsLoading = false
        }
        if (action.payload?.status !== 401) {
          state.error = toContactsErrorKey(
            action.payload,
            'contacts.errors.load'
          )
        }
      }
    }
  )
