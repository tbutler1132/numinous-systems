import { cookies } from 'next/headers'
import { timingSafeEqual } from 'crypto'

const AUTH_COOKIE_NAME = 'auth_token'

/**
 * Validate a token against the DASHBOARD_TOKEN env var
 * Uses timing-safe comparison to prevent timing attacks
 */
export function isValidToken(token: string): boolean {
  const expected = process.env.DASHBOARD_TOKEN
  if (!expected) return false

  // Ensure both strings are the same length for timingSafeEqual
  if (token.length !== expected.length) return false

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

/**
 * Check if the current request is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return false
  return isValidToken(token)
}

/**
 * Get cookie options for auth token
 */
export function getAuthCookieOptions() {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }
}

export { AUTH_COOKIE_NAME }
