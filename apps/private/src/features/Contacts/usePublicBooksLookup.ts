import { useEffect, useState } from 'react'
import { AddressBook } from '@common/features/Contacts/contactsTypes'
import { fetchPublicAddressBooks } from '@common/features/Contacts/ContactsDao'
import { OpenPaasUserData } from '@common/features/User/type/OpenPaasUserData'

interface Lookup {
  userId: string
  books: AddressBook[]
  failed: boolean
}

export function usePublicBooksLookup(user: OpenPaasUserData | null): {
  fetched: AddressBook[] | null
  failed: boolean
} {
  const [result, setResult] = useState<Lookup | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async (): Promise<void> => {
      let books: AddressBook[] = []
      let failed = false
      try {
        books = await fetchPublicAddressBooks(user.id)
      } catch {
        failed = true
      }
      if (!cancelled) setResult({ userId: user.id, books, failed })
    }
    void load()
    return (): void => {
      cancelled = true
    }
  }, [user])

  // a result for another user means we're still loading this one
  const current = result?.userId === user?.id ? result : null
  return {
    fetched: current && !current.failed ? current.books : null,
    failed: current?.failed ?? false
  }
}
