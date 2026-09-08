import { davApi } from '@common/utils/apiUtils'
import { AddressBook, Contact } from './contactsTypes'
import {
  DavAddressBookItem,
  DavAddressBooksResponse,
  DavContactItem,
  DavContactsResponse,
  JCalCard
} from './davTypes'

export async function fetchAddressBooks(
  userId: string
): Promise<AddressBook[]> {
  const response = davApi.get(`addressbooks/${userId}.json`, {
    searchParams: {
      contactsCount: 'true',
      inviteStatus: '2',
      personal: 'true',
      shared: 'true',
      subscribed: 'true'
    }
  })
  const data: DavAddressBooksResponse = await response.json()

  const books = data._embedded?.['dav:addressbook'] ?? []
  return books.map(normalizeAddressBook)
}

export async function fetchContactsForBook(
  userId: string,
  bookId: string
): Promise<Contact[]> {
  const response = davApi.get(`addressbooks/${userId}/${bookId}.json`, {
    searchParams: {
      limit: '500',
      offset: '0',
      sort: 'fn',
      userId
    }
  })
  const data: DavContactsResponse = await response.json()

  const items = data._embedded?.['dav:item'] ?? []
  return items.map(normalizeContact)
}

export function getCardProperty(card: JCalCard, name: string): string | null {
  const value = card[1].find(property => property[0] === name)?.[3]
  return typeof value === 'string' ? value : null
}

function extractId(href: string | undefined, extension: string): string {
  return href?.split('/').pop()?.replace(extension, '') ?? ''
}

function normalizeAddressBook(raw: DavAddressBookItem): AddressBook {
  const id = extractId(raw._links?.self?.href, '.json')
  return {
    id,
    name: raw['dav:name'] ?? id,
    contactsCount: raw.numberOfContacts ?? 0
  }
}

export function normalizeContact(item: DavContactItem): Contact {
  const id = extractId(item._links?.self?.href, '.vcf')
  return {
    id,
    displayName: getCardProperty(item.data, 'fn') ?? id,
    email: getCardProperty(item.data, 'email')
  }
}
