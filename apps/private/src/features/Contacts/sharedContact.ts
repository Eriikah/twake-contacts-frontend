import { Contact } from '@common/features/Contacts/contactsTypes'
import {
  ADDRESS_TYPES,
  ContactFormEntry,
  ContactFormValues,
  EMAIL_TYPES,
  hasValue,
  makeFormValuesFromContact,
  orEmptyEntry,
  PHONE_TYPES
} from './ContactForm/types'

export const SHARED_CONTACT_PARAM = 'shared'
// TODO: adjust to your real "create contact" route
const CREATE_CONTACT_PATH = '/contacts/new'

/** Everything the create form can hold, except where to save it. */
export type SharedContactPayload = Omit<ContactFormValues, 'addressBookId'>

// ---------------------------------------------------------- base64url (UTF-8)

const toBase64Url = (text: string): string => {
  let binary = ''
  new TextEncoder().encode(text).forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string): string => {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(
    Uint8Array.from(binary, char => char.charCodeAt(0))
  )
}

// ------------------------------------------------------------------- encode

export const buildSharedContactUrl = (contact: Contact): string => {
  const values = makeFormValuesFromContact(contact, '')
  const payload: SharedContactPayload = {
    givenName: values.givenName,
    familyName: values.familyName,
    categories: values.categories,
    matrixId: values.matrixId,
    // drop the empty placeholder rows the form adds, the receiver re-adds them
    phones: values.phones.filter(hasValue),
    emails: values.emails.filter(hasValue),
    addresses: values.addresses.filter(hasValue)
  }

  const url = new URL(CREATE_CONTACT_PATH, window.location.href)
  url.searchParams.set(
    SHARED_CONTACT_PARAM,
    toBase64Url(JSON.stringify(payload))
  )
  return url.toString()
}

// ------------------------------------------------------------------- decode

const MAX_ITEMS = 10
const MAX_LENGTH = 200
const MAX_ADDRESS_LENGTH = 500

const cleanString = (value: unknown, max = MAX_LENGTH): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null

const cleanList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(item => cleanString(item))
        .filter((item): item is string => item !== null)
        .slice(0, MAX_ITEMS)
    : []

const cleanEntries = (
  value: unknown,
  allowedTypes: string[],
  max = MAX_LENGTH
): ContactFormEntry[] =>
  orEmptyEntry(
    (Array.isArray(value) ? value : [])
      .map((item: Record<string, unknown>) => {
        const type = cleanString(item?.type)?.toLowerCase() ?? ''
        return {
          type: allowedTypes.includes(type) ? type : '',
          value: cleanString(item?.value, max) ?? ''
        }
      })
      .filter(hasValue)
      .slice(0, MAX_ITEMS)
  )

/**
 * The link comes from anyone, so treat it as untrusted input: validate the
 * shape, cap sizes, keep only known entry types, and only use the result to
 * prefill a form the user reviews before saving.
 */
export const parseSharedContact = (
  param: string | null
): SharedContactPayload | null => {
  if (!param) return null
  try {
    const raw = JSON.parse(fromBase64Url(param)) as Record<string, unknown>
    const givenName = cleanString(raw.givenName) ?? ''
    const familyName = cleanString(raw.familyName) ?? ''
    const emails = cleanEntries(raw.emails, EMAIL_TYPES)
    if (!givenName && !familyName && !emails.some(hasValue)) return null

    return {
      givenName,
      familyName,
      categories: cleanList(raw.categories),
      matrixId: cleanString(raw.matrixId) ?? '',
      phones: cleanEntries(raw.phones, PHONE_TYPES),
      emails,
      addresses: cleanEntries(raw.addresses, ADDRESS_TYPES, MAX_ADDRESS_LENGTH)
    }
  } catch {
    return null
  }
}
