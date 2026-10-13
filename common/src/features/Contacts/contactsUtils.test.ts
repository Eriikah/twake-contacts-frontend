import { DEFAULT_ADDRESS_BOOK_ID } from './constants'
import { AddressBook, Contact } from './contactsTypes'
import { placeContact, sortAddressBooks } from './contactsUtils'

const makeBook = (id: string, name: string): AddressBook => ({
  id,
  userId: 'u1',
  name,
  contactsCount: 0,
  acl: [],
  canWrite: true
})

const t = (key: string): string => key

describe('sortAddressBooks', () => {
  it('puts the default address book first then sorts by name in natural order', () => {
    const books = [
      makeBook('qa-10', 'Book 10'),
      makeBook('qa-2', 'Book 2'),
      makeBook('qa-a', 'alpha'),
      makeBook('qa-book', 'QA Book'),
      makeBook('qa-rw', 'Team RW'),
      makeBook('qa-z', 'Zeta'),
      makeBook(DEFAULT_ADDRESS_BOOK_ID, 'Zzz contacts')
    ]

    expect(sortAddressBooks(books, t).map(book => book.id)).toEqual([
      DEFAULT_ADDRESS_BOOK_ID,
      'qa-a',
      'qa-2',
      'qa-10',
      'qa-book',
      'qa-rw',
      'qa-z'
    ])
  })

  it('does not mutate the input', () => {
    const books = [makeBook('b', 'B'), makeBook('a', 'A')]

    sortAddressBooks(books, t)

    expect(books.map(book => book.id)).toEqual(['b', 'a'])
  })
})

const makeContact = (id: string, displayName: string): Contact => ({
  id,
  displayName,
  emails: []
})

const names = (contacts: Contact[]): string[] =>
  contacts.map(contact => contact.displayName)

describe('placeContact', () => {
  const contacts = [
    makeContact('aaron', 'Aaron Analyse'),
    makeContact('imp', 'Imp Alphab'),
    makeContact('mover', 'Mover Test'),
    makeContact('rita', 'Read Only Rita')
  ]

  it('inserts a new contact after the contacts sharing its first letter', () => {
    expect(
      names(placeContact(contacts, makeContact('abel', 'Abel Second')))
    ).toEqual([
      'Aaron Analyse',
      'Abel Second',
      'Imp Alphab',
      'Mover Test',
      'Read Only Rita'
    ])
  })

  it('ignores case and accents like the server', () => {
    expect(
      names(placeContact(contacts, makeContact('emile', 'émile Zola')))
    ).toEqual([
      'Aaron Analyse',
      'émile Zola',
      'Imp Alphab',
      'Mover Test',
      'Read Only Rita'
    ])
  })

  it('puts a name not starting with a letter first', () => {
    expect(
      names(placeContact(contacts, makeContact('n', '42 Street')))
    ).toEqual([
      '42 Street',
      'Aaron Analyse',
      'Imp Alphab',
      'Mover Test',
      'Read Only Rita'
    ])
  })

  it('moves a renamed contact whose first letter changes', () => {
    expect(
      names(placeContact(contacts, makeContact('aaron', 'Zoe Analyse')))
    ).toEqual(['Imp Alphab', 'Mover Test', 'Read Only Rita', 'Zoe Analyse'])
  })

  it('keeps in place a renamed contact whose first letter is unchanged', () => {
    expect(
      names(placeContact(contacts, makeContact('imp', 'Ivan Alphab')))
    ).toEqual(['Aaron Analyse', 'Ivan Alphab', 'Mover Test', 'Read Only Rita'])
  })
})
