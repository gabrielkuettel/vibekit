/**
 * Dispenser Auth0 Device Code Flow
 *
 * Shared authentication logic for TestNet Dispenser.
 */

/**
 * Create a clickable hyperlink for terminals that support OSC 8
 */
export function hyperlink(url: string, text?: string): string {
  return `\x1b]8;;${url}\x07${text || url}\x1b]8;;\x07`
}

// Auth0 configuration for TestNet Dispenser
const AUTH0_DOMAIN = 'dispenser-prod.eu.auth0.com'
const AUTH0_CLIENT_ID = 'BOZkxGUiiWkaAXZebCQ20MTIYuQSqqpI'
const AUTH0_AUDIENCE = 'api-prod-dispenser-ci'
const AUTH0_SCOPE = 'openid profile email'

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete: string
  expires_in: number
  interval: number
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface TokenErrorResponse {
  error: string
  error_description?: string
}

/**
 * Request a device code from Auth0
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: AUTH0_CLIENT_ID,
      audience: AUTH0_AUDIENCE,
      scope: AUTH0_SCOPE,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to request device code: ${response.status} ${text}`)
  }

  return response.json()
}

/**
 * Poll for token after user authenticates
 */
export async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number
): Promise<string> {
  const startTime = Date.now()
  const expiresAt = startTime + expiresIn * 1000

  while (Date.now() < expiresAt) {
    await new Promise((resolve) => setTimeout(resolve, interval * 1000))

    const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: AUTH0_CLIENT_ID,
        device_code: deviceCode,
        audience: AUTH0_AUDIENCE,
      }),
    })

    if (response.ok) {
      const data = (await response.json()) as TokenResponse
      return data.access_token
    }

    const error = (await response.json()) as TokenErrorResponse

    if (error.error === 'authorization_pending') {
      continue
    } else if (error.error === 'slow_down') {
      interval += 1
      continue
    } else if (error.error === 'expired_token') {
      throw new Error('Authentication timed out. Please try again.')
    } else if (error.error === 'access_denied') {
      throw new Error('Authentication was denied.')
    } else {
      throw new Error(error.error_description || error.error || 'Authentication failed')
    }
  }

  throw new Error('Authentication timed out. Please try again.')
}
