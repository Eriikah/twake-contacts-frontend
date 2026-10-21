import type { Page } from '@playwright/test'

/**
 * The URL of the tab an action opens: the links to the mail, chat and calendar apps. Their
 * hosts answer a blank page (support/fixtures.ts), so the tab keeps the URL it was opened with.
 */
export async function popupUrl(
  page: Page,
  action: () => Promise<void>
): Promise<string> {
  const [popup] = await Promise.all([page.waitForEvent('popup'), action()])
  await popup.waitForLoadState()
  const url = popup.url()
  await popup.close()
  return url
}
