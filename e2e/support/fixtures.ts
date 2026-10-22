import { type Page, test as base, expect } from '@playwright/test'

import { ContactsPage, LoginPage } from '../pages'
import { DavClient } from './dav'
import { env } from './env'
import { trackBearerToken } from './sideService'
import { type E2EUser, E2EUserFactory } from './users'

/**
 * The fixtures every spec imports instead of `@playwright/test`:
 *
 *   import { test, expect } from '../support/fixtures'
 *
 *   test('LIST-01 …', async ({ page, user, dav }) => { ... })
 */
export interface E2EFixtures {
  /** Creates more accounts: `await users.create({ prefix: 'bob' })` */
  users: E2EUserFactory
  /** A brand new account, for this test only */
  user: E2EUser
  /** CardDAV provisioning client of `user` */
  dav: DavClient
  /** CardDAV provisioning client of any other account: `davFor(bob).share(...)` */
  davFor: (user: E2EUser) => DavClient
  /**
   * Signs another account in, in a browser context of its own (its own Dex session):
   * `const bobContacts = await loginInNewContext(bob)`. Closed after the test.
   */
  loginInNewContext: (user: E2EUser) => Promise<ContactsPage>
}

/**
 * Hosts of the other apps (e2e/docker/frontend/env.js). Nothing answers there: the
 * fixture answers a blank page, so that a tab opened towards them keeps its URL.
 */
const OTHER_APPS = /^https?:\/\/(mail|chat|calendar)\.e2e\.local\//

/** What every page of the suite gets; returns the uncaught exceptions it will collect */
async function instrument(page: Page): Promise<string[]> {
  await page
    .context()
    .route(OTHER_APPS, route =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html>' })
    )
  trackBearerToken(page)
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  return pageErrors
}

export const test = base.extend<E2EFixtures>({
  page: async ({ page }, use) => {
    const pageErrors = await instrument(page)
    await use(page)
    // An uncaught exception is a bug whatever the screen shows
    expect(pageErrors, 'uncaught exceptions in the page').toEqual([])
  },

  loginInNewContext: async ({ browser, viewport }, use) => {
    const opened: { close: () => Promise<void>; errors: string[] }[] = []
    await use(async user => {
      const context = await browser.newContext({
        baseURL: env.baseUrl,
        ignoreHTTPSErrors: true,
        locale: 'en-US',
        timezoneId: 'Europe/Paris',
        viewport
      })
      const page = await context.newPage()
      opened.push({
        close: () => context.close(),
        errors: await instrument(page)
      })
      return new LoginPage(page).loginAs(user)
    })
    for (const { close, errors } of opened) {
      await close()
      expect(errors, 'uncaught exceptions in the other page').toEqual([])
    }
  },

  // Playwright fixtures receive an empty destructuring pattern when they need no other fixture
  // eslint-disable-next-line no-empty-pattern
  users: async ({}, use) => {
    await use(new E2EUserFactory())
  },

  user: async ({ users }, use) => {
    await use(await users.create({ prefix: 'alice' }))
  },

  dav: async ({ user }, use) => {
    await use(DavClient.forUser(user))
  },

  // eslint-disable-next-line no-empty-pattern
  davFor: async ({}, use) => {
    await use((user: E2EUser) => DavClient.forUser(user))
  }
})

export { expect }
export type { E2EUser }
