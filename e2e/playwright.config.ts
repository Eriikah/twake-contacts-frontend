import { defineConfig, devices } from '@playwright/test'

import { env, hostResolverRules } from './support/env'

const isCI = process.env.CI !== undefined && process.env.CI !== ''

type TraceMode = 'on' | 'off' | 'retain-on-failure' | 'on-first-retry'
const TRACE_MODES: readonly TraceMode[] = [
  'on',
  'off',
  'retain-on-failure',
  'on-first-retry'
]

function traceMode(raw: string | undefined): TraceMode {
  return TRACE_MODES.find(mode => mode === raw) ?? 'retain-on-failure'
}

/**
 * Specs that only make sense on some screens, tagged instead of skipped so that no project
 * lists a test it cannot run: `@phone-only` (mobile), `@desktop-only` (chromium).
 */
const PHONE_SPECS = /@phone-only|RESP-/
const NOT_ON_PHONE = /@desktop-only/

/**
 * One retry by default: on a Docker host, Chromium aborts the requests in flight with
 * net::ERR_NETWORK_CHANGED whenever a container joins or leaves any network of the host (another
 * stack starting). Playwright reports a test that passed on its retry as flaky.
 */
function retries(raw: string | undefined): number {
  const parsed = Number(raw)
  return raw !== undefined && Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : 1
}

function workers(raw: string | undefined): number | undefined {
  const parsed = Number(raw)
  if (raw !== undefined && Number.isInteger(parsed) && parsed > 0) {
    return parsed
  }
  return isCI ? 2 : 4
}

/**
 * Twake Contacts e2e suite. Backend: e2e/scripts/start.sh. Conventions: e2e/README.md.
 * Backlog of scenarios: e2e/e2e.md.
 *
 * `export default` is what Playwright loads: the one exception to the named exports rule.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results/artifacts',
  globalSetup: './support/global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: retries(process.env.E2E_RETRIES),
  workers: workers(process.env.E2E_WORKERS),
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['junit', { outputFile: './test-results/junit.xml' }]
  ],
  use: {
    baseURL: env.baseUrl,
    // Dex is served over HTTPS with a self-signed certificate (Dockerfile.dex of the calendar e2e)
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'Europe/Paris',
    trace: traceMode(process.env.E2E_TRACE),
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: process.env.E2E_HEADLESS !== 'false',
    launchOptions: {
      slowMo: Number(process.env.E2E_SLOWMO ?? 0),
      // localhost:8099, api, dav and sso are the containers of the stack
      args: hostResolverRules()
    }
  },
  projects: [
    {
      name: 'chromium',
      grepInvert: PHONE_SPECS,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      // The phone layout of the app (up to 768 px wide), in Chromium
      name: 'mobile',
      grep: PHONE_SPECS,
      grepInvert: NOT_ON_PHONE,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true
      }
    }
  ]
})
