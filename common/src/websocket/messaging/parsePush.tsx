export interface AddressBookPush {
  syncToken?: string
  imports?: Record<
    string,
    { status: string; succeedCount?: number; failedCount?: number }
  >
}

export function parsePush(
  message: unknown
): Record<string, AddressBookPush> | null {
  if (typeof message === 'string') {
    try {
      return JSON.parse(message)
    } catch {
      return null
    }
  }
  return message && typeof message === 'object'
    ? (message as Record<string, AddressBookPush>)
    : null
}
