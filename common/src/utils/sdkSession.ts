import { createSdk, type Sdk } from '@linagora/twake-sdk'

// Keep one client per platform: its refreshed credentials outlive the ID token.
interface SdkSession {
  sdk: Sdk
  signingIn: Promise<void> | null
}

// The bar shows an avatar skeleton while the token exchange is pending: past
// this delay it shows the fallback user, then turns ready if the exchange ends.
export const SDK_WAITING_TIMEOUT = 5000

const sessions = new Map<string, SdkSession>()

const getSession = (platformURL: string): SdkSession => {
  let session = sessions.get(platformURL)
  if (!session) {
    session = {
      sdk: createSdk({
        platformURL,
        waitingTimeout: SDK_WAITING_TIMEOUT
      }),
      signingIn: null
    }
    sessions.set(platformURL, session)
  }
  return session
}

export const getPlatformSdk = (platformURL: string): Sdk =>
  getSession(platformURL).sdk

export async function ensureSdkSignedIn(
  platformURL: string,
  idToken: string
): Promise<Sdk> {
  const session = getSession(platformURL)
  if (session.sdk.status !== 'ready') {
    session.signingIn ??= session.sdk.login(idToken).finally(() => {
      session.signingIn = null
    })
    await session.signingIn
  }
  return session.sdk
}
