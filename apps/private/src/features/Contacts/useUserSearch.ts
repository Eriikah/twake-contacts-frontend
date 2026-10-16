import { useEffect, useState } from 'react'
import { useAppSelector } from '@common/app/hooks'
import { OpenPaasUserData } from '@common/features/User/type/OpenPaasUserData'
import { searchUsers } from '@common/features/User/UserDao'

export function useUserSearch(query: string): {
  users: OpenPaasUserData[]
  loading: boolean
} {
  const openpaasId = useAppSelector(state => state.user.userData.openpaasId)
  const [users, setUsers] = useState<OpenPaasUserData[]>([])
  const [loading, setLoading] = useState(false)
  const trimmed = query.trim()

  useEffect(() => {
    if (!trimmed || !openpaasId) return
    let cancelled = false
    setLoading(true)
    setUsers([])

    searchUsers(trimmed, [openpaasId]).then(result => {
      if (cancelled) return
      setUsers(result)
      setLoading(false)
    })

    return (): void => {
      cancelled = true
    }
  }, [trimmed, openpaasId])

  return { users: trimmed ? users : [], loading: trimmed ? loading : false }
}
