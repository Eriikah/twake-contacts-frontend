import { expect, type Locator, type Page } from '@playwright/test'

import { ContactsPage } from './ContactsPage'

/** Credentials of a test account (support/users.ts E2EUser fits) */
export interface Credentials {
  email: string
  password: string
}

/**
 * The Dex login form (LDAP connector of the calendar e2e stack) the app sends the user to.
 * The app keeps its tokens in memory only: every full page load goes through Dex again, and
 * signs in silently while the Dex session lasts.
 */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByRole('textbox', { name: 'Email address' })
    this.passwordInput = page.getByRole('textbox', { name: 'Password' })
    this.submitButton = page.getByRole('button', { name: 'Login' })
  }

  /** Fills the Dex form, which must be on screen */
  async submit(credentials: Credentials): Promise<void> {
    await this.emailInput.fill(credentials.email)
    await this.passwordInput.fill(credentials.password)
    await this.submitButton.click()
  }

  /**
   * Opens `path` (the app by default), signs in on Dex and waits for the app:
   * `const contacts = await new LoginPage(page).loginAs(user)`.
   */
  async loginAs(
    credentials: Credentials,
    path: string = '/'
  ): Promise<ContactsPage> {
    const contacts = new ContactsPage(this.page)
    // Chromium aborts a navigation with net::ERR_NETWORK_CHANGED when the host gets a new
    // network interface, which a Docker host does whenever a bridge is created: start again,
    // the Dex session signs in silently if the form was already submitted
    await expect(async () => {
      await this.page.goto(path)
      await expect(this.emailInput.or(contacts.main)).toBeVisible({
        timeout: 10_000
      })
      if (await this.emailInput.isVisible()) await this.submit(credentials)
      await contacts.expectLoaded()
    }).toPass({ timeout: 60_000 })
    return contacts
  }
}
