/**
 * @jest-environment jsdom
 */
import { getCardProperty, normalizeContact } from './ContactsDao'
import { DavContactItem, DavContactsResponse, JCalCard } from './davTypes'

/**
 * Synthetic data mirroring the shape of a real
 * `GET /addressbooks/<userId>/collected.json` response. Keeps the three
 * variations the server emits: `fn` last, `fn` first, and a card whose `fn`
 * is just the email address.
 */
const response: DavContactsResponse = {
  _links: { self: { href: '/addressbooks/user-1/collected.json' } },
  'dav:syncToken': 47,
  _embedded: {
    'dav:item': [
      {
        _links: {
          self: { href: '/addressbooks/user-1/collected/contact-1.vcf' }
        },
        etag: '"00000000000000000000000000000001"',
        data: [
          'vcard',
          [
            ['version', {}, 'text', '4.0'],
            ['uid', {}, 'text', 'contact-1'],
            ['email', { type: 'work' }, 'text', 'jdoe@twake.app'],
            ['fn', {}, 'text', 'jdoe@twake.app']
          ]
        ]
      },
      {
        _links: {
          self: { href: '/addressbooks/user-1/collected/contact-2.vcf' }
        },
        etag: '"00000000000000000000000000000002"',
        data: [
          'vcard',
          [
            ['version', {}, 'text', '4.0'],
            ['fn', {}, 'text', 'Jane Roe'],
            ['uid', {}, 'text', 'contact-2'],
            ['email', { type: 'work' }, 'text', 'jane.roe@example.org']
          ]
        ]
      }
    ]
  }
}

const [collectedItem, namedItem] = response._embedded?.['dav:item'] ?? []

describe('normalizeContact', () => {
  it('reads the id from the self link, not from the uid property', () => {
    expect(normalizeContact(collectedItem).id).toBe('contact-1')
  })

  it('reads properties by name whatever their order in the card', () => {
    expect(normalizeContact(namedItem)).toEqual({
      id: 'contact-2',
      displayName: 'Jane Roe',
      email: 'jane.roe@example.org'
    })
  })

  it('keeps the email as display name for a collected contact', () => {
    expect(normalizeContact(collectedItem).displayName).toBe('jdoe@twake.app')
  })

  it('falls back to the id when the card carries no fn', () => {
    const withoutFn: DavContactItem = {
      ...collectedItem,
      data: ['vcard', [['version', {}, 'text', '4.0']]]
    }
    expect(normalizeContact(withoutFn).displayName).toBe('contact-1')
  })
})

describe('getCardProperty', () => {
  it('returns null for an absent property', () => {
    expect(getCardProperty(collectedItem.data, 'tel')).toBeNull()
  })

  it('returns null for a structured property rather than an array', () => {
    const card: JCalCard = [
      'vcard',
      [['n', {}, 'text', ['Roe', 'Jane', '', '', '']]]
    ]
    expect(getCardProperty(card, 'n')).toBeNull()
  })
})
