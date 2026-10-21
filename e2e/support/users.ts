import { randomBytes } from 'node:crypto'

import { Client } from 'ldapts'

import { env, stack } from './env'

/** An account created for one test. Accounts are never reused, so none is deleted. */
export interface E2EUser {
  /** LDAP uid, also the local part of the address: `<prefix>-<random>` */
  uid: string
  /** `<uid>@open-paas.org`, what the Dex form asks for */
  email: string
  password: string
  /** OpenPaaS id, the `<userId>` of `/addressbooks/<userId>/<bookId>` */
  id: string
  firstName: string
  lastName: string
  /** First name + last name, as the app shows the owner of a shared address book */
  displayName: string
}

export interface CreateUserOptions {
  /** Readable start of the uid, `user` by default: `alice` gives `alice-<random>` */
  prefix?: string
  /** `Alice` for the `alice` prefix by default */
  firstName?: string
  /** The random part of the uid by default, so that two users never share a name */
  lastName?: string
}

const USERS_BASE_DN = 'ou=users,dc=open-paas.org,dc=lng'
const ADMIN_DN = 'cn=admin,dc=open-paas.org,dc=lng'
const ADMIN_PASSWORD = 'admin'

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/**
 * Creates accounts on demand, as the e2e suite of twake-calendar-frontend does
 * (E2EUserFactory.java): Dex authenticates against the LDAP directory of the stack, so an
 * account is an LDAP entry, and registering it to the side service makes it known to the
 * backend (people search, sharing) before its first login. The user, not a global reset, is the
 * unit of isolation: tests run in parallel on one stack.
 */
export class E2EUserFactory {
  async create(options: CreateUserOptions = {}): Promise<E2EUser> {
    const prefix = options.prefix ?? 'user'
    const suffix = randomBytes(4).toString('hex')
    const uid = `${prefix}-${suffix}`
    const firstName = options.firstName ?? capitalize(prefix)
    const lastName = options.lastName ?? suffix
    const user: E2EUser = {
      uid,
      email: `${uid}@${env.domain}`,
      password: env.password,
      id: '',
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`
    }
    await this.#addToDirectory(user)
    await this.#register(user)
    return { ...user, id: await this.#openpaasId(user) }
  }

  async #addToDirectory(user: E2EUser): Promise<void> {
    const client = new Client({ url: `ldap://${stack().ldap}:389` })
    try {
      await client.bind(ADMIN_DN, ADMIN_PASSWORD)
      await client.add(`uid=${user.uid},${USERS_BASE_DN}`, {
        objectClass: 'inetOrgPerson',
        uid: user.uid,
        cn: user.displayName,
        sn: user.lastName,
        givenName: user.firstName,
        mail: user.email,
        userPassword: user.password
      })
    } finally {
      await client.unbind()
    }
  }

  async #register(user: E2EUser): Promise<void> {
    const response = await fetch(
      `http://${stack().sideService}:8000/registeredUsers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          firstname: user.firstName,
          lastname: user.lastName,
          // ignored: the side service picks the id, read back by #openpaasId
          id: randomBytes(12).toString('hex')
        })
      }
    )
    if (response.status !== 201) {
      throw new Error(
        `The side service refused to register ${user.email}: ${response.status} ${await response.text()}`
      )
    }
  }

  async #openpaasId(user: E2EUser): Promise<string> {
    const response = await fetch(
      `http://${stack().sideService}:8000/registeredUsers?email=${encodeURIComponent(user.email)}`
    )
    const body: unknown = await response.json()
    if (
      typeof body !== 'object' ||
      body === null ||
      !('id' in body) ||
      typeof body.id !== 'string'
    ) {
      throw new Error(
        `No OpenPaaS id for ${user.email}: ${JSON.stringify(body)}`
      )
    }
    return body.id
  }
}
