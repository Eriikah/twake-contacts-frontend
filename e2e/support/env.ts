import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Where the containers of the stack answer, as written by scripts/start.sh. Nothing is
 * published on the host: the browser and the harness reach the containers by their IP.
 */
export interface StackAddresses {
  project: string
  frontend: string
  proxy: string
  sso: string
  sideService: string
  sabre: string
  ldap: string
  mockSmtp: string
}

/**
 * Every knob of the suite, read once. The URLs below are the ones the app itself uses
 * (e2e/docker/frontend/env.js): the browser resolves them through --host-resolver-rules.
 */
export interface E2EEnv {
  /** The app, as the browser sees it: a secure context, so that PKCE has crypto.subtle */
  baseUrl: string
  /** Side service as the browser sees it (SIDE_SERVICE_BASE_URL of the app) */
  apiUrl: string
  /** Dex as the browser sees it */
  ssoUrl: string
  /** null until scripts/start.sh has run */
  stack: StackAddresses | null
  /** Mail domain of every test user (the LDAP base of the stack) */
  domain: string
  /** Password of every test user */
  password: string
}

const E2E_DIR = join(__dirname, '..')
export const STACK_FILE = join(E2E_DIR, '.generated', 'stack.json')

function isStack(value: unknown): value is StackAddresses {
  if (typeof value !== 'object' || value === null) return false
  return [
    'project',
    'frontend',
    'proxy',
    'sso',
    'sideService',
    'sabre',
    'ldap',
    'mockSmtp'
  ].every(
    key =>
      key in value &&
      typeof (value as Record<string, unknown>)[key] === 'string' &&
      (value as Record<string, string>)[key] !== ''
  )
}

function readStack(): StackAddresses | null {
  if (!existsSync(STACK_FILE)) return null
  const parsed: unknown = JSON.parse(readFileSync(STACK_FILE, 'utf8'))
  return isStack(parsed) ? parsed : null
}

export const env: E2EEnv = {
  baseUrl: 'http://localhost:8099',
  apiUrl: 'http://api',
  ssoUrl: 'https://sso:5554',
  stack: readStack(),
  domain: 'open-paas.org',
  password: 'secret'
}

/** The stack, or a failure telling how to start it */
export function stack(): StackAddresses {
  if (env.stack === null) {
    throw new Error(
      `No e2e stack: ${STACK_FILE} is missing. Start it with ./scripts/start.sh`
    )
  }
  return env.stack
}

/**
 * Chromium flag mapping the hostnames of the app configuration to the containers, as
 * scripts/qa-environment/start.sh prints it for a manual browser.
 */
export function hostResolverRules(): string[] {
  if (env.stack === null) return []
  const { frontend, proxy, sso } = env.stack
  return [
    `--host-resolver-rules=MAP localhost:8099 ${frontend}:80,MAP api ${proxy}:80,MAP dav ${proxy}:80,MAP sso ${sso}:5554`
  ]
}
