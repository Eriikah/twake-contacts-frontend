/**
 * Temporary fallback. This should be in twake-mui.
 */
export const getInitials = (displayName: string): string => {
  const words = displayName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const [first, ...rest] = words
  const last = rest.at(-1)
  return `${first[0]}${last?.[0] ?? ''}`.toUpperCase()
}
