import { createAction, ReducerCreators } from '@reduxjs/toolkit'
import { RejectedError, toRejectedError } from '@common/utils/errorUtils'
import {
  fetchAddressBookDetails,
  resolveAddressBookMember
} from '../ContactsDao'
import { ContactsState } from '../contactsTypes'
import { userData } from '@common/features/User/userDataTypes'

export interface FetchAddressBookDetailPayload {
  userId: string
  addressBookId: string
  silent?: boolean
}

interface DetailRequest {
  addressBookId: string
  requestId: string
}

/** The members of the book are known, their profiles are not yet. */
export const addressBookDetailReceived = createAction<
  DetailRequest & { members: userData[]; isPublic: boolean; silent?: boolean }
>('contacts/addressBookDetailReceived')

/** The profile of one member of the book has been looked up. */
export const addressBookMemberResolved = createAction<
  DetailRequest & { member: userData }
>('contacts/addressBookMemberResolved')

const isLatestDetailRequest = (
  state: ContactsState,
  { addressBookId, requestId }: DetailRequest
): boolean =>
  state.detailRequestIds?.[addressBookId] === requestId &&
  Boolean(state.addressBooks[addressBookId])

export const reduceAddressBookDetailReceived = (
  state: ContactsState,
  action: ReturnType<typeof addressBookDetailReceived>
): void => {
  const { addressBookId, members, isPublic, silent } = action.payload
  if (!silent) {
    state.detailsLoading = false
  }
  if (isLatestDetailRequest(state, action.payload)) {
    state.addressBooks[addressBookId] = {
      ...state.addressBooks[addressBookId],
      invitedMembers: members,
      isPublic
    }
  }
}

export const reduceAddressBookMemberResolved = (
  state: ContactsState,
  action: ReturnType<typeof addressBookMemberResolved>
): void => {
  const { addressBookId, member } = action.payload
  if (!isLatestDetailRequest(state, action.payload)) return
  const book = state.addressBooks[addressBookId]
  book.invitedMembers = book.invitedMembers?.map(m =>
    m.href === member.href ? member : m
  )
}

export const fetchAddressBookDetailThunk = (
  create: ReducerCreators<ContactsState>
) =>
  create.asyncThunk<
    { addressBookId: string },
    FetchAddressBookDetailPayload,
    { rejectValue: RejectedError }
  >(
    async (
      { userId, addressBookId, silent },
      { dispatch, requestId, rejectWithValue }
    ) => {
      let details: { members: userData[]; isPublic: boolean }
      try {
        details = await fetchAddressBookDetails(userId, addressBookId)
      } catch (err) {
        return rejectWithValue(toRejectedError(err))
      }
      // the members are listed at once, each completed when its lookup answers
      dispatch(
        addressBookDetailReceived({
          addressBookId,
          requestId,
          silent,
          ...details
        })
      )
      await Promise.all(
        details.members.map(async member =>
          dispatch(
            addressBookMemberResolved({
              addressBookId,
              requestId,
              member: await resolveAddressBookMember(member)
            })
          )
        )
      )
      return { addressBookId }
    },
    {
      pending: (state, action) => {
        state.detailRequestIds ??= {}
        state.detailRequestIds[action.meta.arg.addressBookId] =
          action.meta.requestId
        if (!action.meta.arg.silent) {
          state.detailsLoading = true
        }
      },
      // the failure belongs to the dialog that asked for the details, not to
      // the contact list: it is reported there
      rejected: (state, action) => {
        if (!action.meta.arg.silent) {
          state.detailsLoading = false
        }
      }
    }
  )
