import { expect } from '@playwright/test'

import { stack } from './env'

/** A mail the backend sent, as the mock SMTP server of the stack keeps it */
export interface SentMail {
  from: string
  recipients: { address: string }[]
  /** Raw MIME message */
  message: string
}

function isSentMail(value: unknown): value is SentMail {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    'recipients' in value &&
    Array.isArray(value.recipients)
  )
}

export async function sentMails(): Promise<SentMail[]> {
  const response = await fetch(`http://${stack().mockSmtp}:8000/smtpMails`)
  const body: unknown = await response.json()
  return Array.isArray(body) ? body.filter(isSentMail) : []
}

/** Waits for a mail to `to` whose raw message contains `text`: `Subject: Contacts import reporting` */
export async function waitForMail(
  to: string,
  text: string,
  timeout = 60_000
): Promise<SentMail> {
  let found: SentMail | undefined
  await expect
    .poll(
      async () => {
        found = (await sentMails()).find(
          mail =>
            mail.recipients.some(recipient => recipient.address === to) &&
            mail.message.includes(text)
        )
        return found !== undefined
      },
      { timeout, message: `a mail to ${to} with "${text}"` }
    )
    .toBe(true)
  return found as SentMail
}
