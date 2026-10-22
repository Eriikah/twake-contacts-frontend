import { LoginPage } from '../pages'
import { expect, test } from '../support/fixtures'

test.describe('THEME dark mode', () => {
  test('THEME-01 toggle dark mode and back', async ({ page, user }) => {
    const contacts = await new LoginPage(page).loginAs(user)
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'light')

    await contacts.themeToggle.hover()
    await expect(page.getByRole('tooltip', { name: 'Dark mode' })).toBeVisible()
    await contacts.themeToggle.click()

    await expect(html).toHaveAttribute('data-theme', 'dark')
    await expect(contacts.themeToggle).toHaveAccessibleName('Light mode')

    await contacts.themeToggle.click()
    await expect(html).toHaveAttribute('data-theme', 'light')
    await expect(contacts.themeToggle).toHaveAccessibleName('Dark mode')
  })

  test('THEME-02 the chosen theme is kept after a reload, not in a new browser', async ({
    page,
    user,
    loginInNewContext
  }) => {
    const contacts = await new LoginPage(page).loginAs(user)
    await contacts.themeToggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await contacts.reload()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(contacts.themeToggle).toHaveAccessibleName('Light mode')
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(
      'dark'
    )
    await contacts.clickCreate()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    const fresh = await loginInNewContext(user)
    await expect(fresh.page.locator('html')).toHaveAttribute(
      'data-theme',
      'light'
    )
  })
})
