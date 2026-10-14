import { useEffect, useState } from 'react'
import { useAppSelector } from '@common/app/hooks'
import { UserResult } from '@common/features/Contacts/contactsTypes'
import { searchUsers } from '@common/features/Contacts/ContactsDao'

const DEBOUNCE_MS = 300

export function useUserSearch(query: string): UserResult[] {
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const [users, setUsers] = useState<UserResult[]>([])
  const trimmed = query.trim()

  useEffect(() => {
    if (!trimmed || !openpaasId) return
    const ctrl = new AbortController()

    const timer = setTimeout((): void => {
      const run = async (): Promise<void> => {
        try {
          setUsers(await searchUsers(trimmed, openpaasId, ctrl.signal))
        } catch {
          // aborted or failed: keep the previous options
        }
      }
      void run()
    }, DEBOUNCE_MS)

    return (): void => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [trimmed, openpaasId])

  // stale results are hidden rather than cleared inside the effect
  return trimmed ? users : []
}
