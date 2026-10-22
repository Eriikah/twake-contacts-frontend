import { LoginPage } from '../pages'
import { expect, test } from '../support/fixtures'

test.describe('DEL delete contact', () => {
  test('DEL-01 delete from the contact page of a book', async ({
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
    await contacts.openBook('QA Book')
    const contact = await contacts.openContact('Jane Doe')

    await contact.deleteButton.hover()
    await expect(page.getByRole('tooltip', { name: 'Delete' })).toBeVisible()
    let dialog = await contact.openDeleteDialog()
    await expect(dialog.description).toBeVisible()
    await expect(dialog.root).toContainText('JD')
    await expect(dialog.root).toContainText('jane.doe@example.com')
    await dialog.cancelButton.click()
    await expect(dialog.root).toBeHidden()
    await expect(contact.name).toHaveText('Jane Doe')

    dialog = await contact.openDeleteDialog()
    await dialog.confirmButton.click()

    await expect(page).toHaveURL('/contacts/qa-book')
    await expect(contacts.row('Jane Doe')).toHaveCount(0)
    expect(await dav.getContact('qa-book', jane)).toBeNull()
    await contacts.reload()
    await expect(contacts.emptyState).toBeVisible()
  })

  test('DEL-01 delete a default book contact from My contacts', async ({
    page,
    user,
    dav
  }) => {
    const anna = await dav.putContact('contacts', {
      firstName: 'Anna',
      lastName: 'Default'
    })
    await dav.putContact('contacts', { firstName: 'Kept', lastName: 'One' })
    const contacts = await new LoginPage(page).loginAs(user)
    const contact = await contacts.openContact('Anna Default')

    const dialog = await contact.openDeleteDialog()
    await dialog.confirmButton.click()

    await expect(page).toHaveURL('/contacts')
    await expect(contacts.row('Kept One')).toBeVisible()
    await expect(contacts.row('Anna Default')).toHaveCount(0)
    expect(await dav.getContact('contacts', anna)).toBeNull()
  })

  test('DEL-01 delete from a page opened from My contacts goes back to My contacts', async ({
    page,
    user,
    dav
  }) => {
    await dav.createAddressBook({ id: 'qa-book', name: 'QA Book' })
    await dav.putContact('qa-book', { firstName: 'Quentin', lastName: 'Book' })
    await dav.putContact('contacts', { firstName: 'Kept', lastName: 'One' })
    const contacts = await new LoginPage(page).loginAs(user)
    const contact = await contacts.openContact('Quentin Book')

    const dialog = await contact.openDeleteDialog()
    await dialog.confirmButton.click()

    await expect(page).toHaveURL('/contacts')
    await expect(contacts.row('Kept One')).toBeVisible()
    await expect(contacts.row('Quentin Book')).toHaveCount(0)
  })
})
