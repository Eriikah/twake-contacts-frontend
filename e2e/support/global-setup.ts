import { request } from '@playwright/test'

import { STACK_FILE, env } from './env'

/**
 * Fails fast, with a hint, when the stack is not running: a broken stack would otherwise show
 * up as dozens of unrelated timeouts.
 */
async function probe(
  what: string,
  check: () => Promise<boolean>
): Promise<string | null> {
  try {
    return (await check()) ? null : `${what}: unexpected answer`
  } catch (error: unknown) {
    const cause =
      error instanceof Error && error.cause instanceof Error
        ? ` (${error.cause.message})`
        : ''
    return `${what}: ${error instanceof Error ? error.message : String(error)}${cause}`
  }
}

// Playwright loads globalSetup through its default export: the one exception to named exports
export default async function globalSetup(): Promise<void> {
  const stack = env.stack
  if (stack === null) {
    throw new Error(
      `No e2e stack: ${STACK_FILE} is missing.\n` +
        'Build the images with ../scripts/qa-environment/build.sh, then start the stack with ./scripts/start.sh'
    )
  }
  const dex = await request.newContext({ ignoreHTTPSErrors: true })
  try {
    const problems = (
      await Promise.all([
        probe(
          `app http://${stack.frontend}/`,
          async () => (await fetch(`http://${stack.frontend}/`)).ok
        ),
        probe(
          `side service http://${stack.sideService}:8000/registeredUsers`,
          async () =>
            (await fetch(`http://${stack.sideService}:8000/registeredUsers`)).ok
        ),
        // 401: Sabre is up and asks for credentials
        probe(
          `Sabre http://${stack.sabre}/`,
          async () => (await fetch(`http://${stack.sabre}/`)).status < 500
        ),
        probe(`Dex https://${stack.sso}:5554`, async () =>
          (
            await dex.get(
              `https://${stack.sso}:5554/.well-known/openid-configuration`
            )
          ).ok()
        )
      ])
    ).filter((problem): problem is string => problem !== null)

    if (problems.length > 0) {
      throw new Error(
        `The e2e stack is not reachable:\n  - ${problems.join('\n  - ')}\n` +
          'Restart it with ./scripts/stop.sh && ./scripts/start.sh'
      )
    }
  } finally {
    await dex.dispose()
  }
}
