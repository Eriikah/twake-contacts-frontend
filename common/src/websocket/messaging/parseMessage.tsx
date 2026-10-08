import { MutableRefObject } from 'react'
import { AddressBookPush, parsePush } from './parsePush'
import { fetchUpdatedContacts } from '@common/features/Contacts/ContactsSlice'
import { AppDispatch } from '@common/app/store'

export const ADDRESSBOOK_PATH = /^\/addressbooks\/([^/]+)\/([^/]+)$/

export function parseMessage(
  message: unknown,
  syncTokensRef: MutableRefObject<Map<string, string>>,
  dispatch: AppDispatch
): void {
  const payload = parsePush(message)
  if (!payload) {
    console.info(message)
    return
  }

  for (const [path, push] of Object.entries(payload)) {
    const match = ADDRESSBOOK_PATH.exec(path)
    if (!match) {
      console.info({ [path]: push })
      continue
    }
    const [, userId, bookId] = match

    // Contact created/updated/deleted: refetch when the token moved
    handleBookUpdate({ push, syncTokensRef, path, dispatch, userId, bookId })

    // vCard import result
    handleImportNotification(push, userId, bookId)
  }
}

function handleImportNotification(
  push: AddressBookPush,
  userId: string,
  bookId: string
) {
  if (push.imports) {
    for (const [importId, result] of Object.entries(push.imports)) {
      console.info({
        userId,
        bookId,
        importId,
        status: result.status,
        succeedCount: result.succeedCount ?? 0,
        failedCount: result.failedCount ?? 0
      })
    }
  }
}

function handleBookUpdate({
  push,
  syncTokensRef,
  path,
  dispatch,
  userId,
  bookId
}: {
  push: AddressBookPush
  syncTokensRef: MutableRefObject<Map<string, string>>
  path: string
  dispatch: AppDispatch
  userId: string
  bookId: string
}) {
  if (push.syncToken === undefined) return
  if (syncTokensRef.current.get(path) !== push.syncToken) {
    syncTokensRef.current.set(path, push.syncToken)
    void dispatch(
      fetchUpdatedContacts({
        userId,
        bookId,
        newSyncToken: Number(push.syncToken)
      })
    )
  }
}
