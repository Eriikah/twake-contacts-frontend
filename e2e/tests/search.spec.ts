import { ContactPage, LoginPage } from '../pages'
import { READ_WRITE } from '../support/dav'
import { expect, test } from '../support/fixtures'

test.describe('SEARCH search', () => {
  test('SEARCH-01 search a contact and open it', async ({
    page,
    user,
    dav
  }) => {
    await dav.createAddressBook({ id: 'qa-book', name: 'QA Book' })
    const jane = await dav.putContact('qa-book', {
      firstName: 'Jane',
      lastName: 'Doe',
      emails: ['jane.doe@example.com']
    })
    const contacts = await new LoginPage(page).loginAs(user)

    await contacts.search('jan')

    const option = contacts.searchOption('Jane Doe')
    await expect(option).toBeVisible()
    await option.click()
    await expect(page).toHaveURL(`/contacts/qa-book/${jane}`)
    await expect(new ContactPage(page).name).toHaveText('Jane Doe')
    await expect(contacts.searchBox).toHaveValue('')
  })

  test('SEARCH-02 no result, clearing, only spaces', async ({ page, user }) => {
    const contacts = await new LoginPage(page).loginAs(user)

    await contacts.search('zzqx')
    await expect(page.getByText('No contacts found')).toBeVisible()

    await contacts.searchBox.fill('')
    await expect(contacts.searchBox).toHaveValue('')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(page.getByText('No contacts found')).toBeHidden()

    await contacts.search('   ')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(page.getByText('No contacts found')).toBeHidden()
  })

  test('SEARCH-03 search across own and shared books', async ({
    page,
    user,
    users,
    dav,
    davFor
  }) => {
    const alice = await users.create({ prefix: 'alice' })
    await davFor(alice).createAddressBook({ id: 'qa-book', name: 'QA Book' })
    const shared = await davFor(alice).putContact('qa-book', {
      firstName: 'Search',
      lastName: 'Shared',
      emails: ['search.shared@example.com']
    })
    await davFor(alice).share('qa-book', user, READ_WRITE)
    await dav.putContact('contacts', { firstName: 'Search', lastName: 'Own' })
    const contacts = await new LoginPage(page).loginAs(user)

    await contacts.search('search')

    await expect(contacts.searchOption('Search Own')).toBeVisible()
    await contacts.searchOption('Search Shared').click()
    const copy = await dav.sharedCopyOf(alice, 'qa-book')
    await expect(page).toHaveURL(`/contacts/${copy}/${shared}`)
    const contact = new ContactPage(page)
    await expect(contact.name).toHaveText('Search Shared')
    await expect(contact.detail('search.shared@example.com')).toBeVisible()
  })

  test('SEARCH-04 search finds a contact that is not loaded yet', async ({
    page,
    user,
    dav
  }) => {
    for (let i = 1; i <= 60; i++) {
      const n = String(i).padStart(3, '0')
      await dav.putContact('contacts', {
        firstName: 'Bulk',
        lastName: n,
        emails: [`bulk${n}@example.com`]
      })
    }
    const contacts = await new LoginPage(page).loginAs(user)
    await expect(contacts.row('Bulk 001')).toBeVisible()

    const contact = await contacts.openFromSearch('Bulk 059', 'Bulk 059')

    await expect(contact.detail('bulk059@example.com')).toBeVisible()
    await contact.backLink.click()
    await expect(page).toHaveURL('/contacts')
  })
})
