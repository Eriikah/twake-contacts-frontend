const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Surrounding whitespace is ignored: it is trimmed when the contact is saved. */
export const isValidEmail = (email: string): boolean =>
  EMAIL_REGEX.test(email.trim())
