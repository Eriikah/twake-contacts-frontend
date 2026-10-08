import { MutableRefObject } from 'react'
import { parsePush } from './parsePush'

export const ADDRESSBOOK_PATH = /^\/addressbooks\/([^/]+)\/([^/]+)$/

export function parseMessage(
  message: unknown,
  syncTokensRef: MutableRefObject<Map<string, string>>
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
    if (push.syncToken !== undefined) {
      if (syncTokensRef.current.get(path) !== push.syncToken) {
        syncTokensRef.current.set(path, push.syncToken)
        console.log({ userId, bookId })
      }
    }

    // vCard import result
    if (push.imports) {
      for (const [importId, result] of Object.entries(push.imports)) {
        console.log({
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
}
