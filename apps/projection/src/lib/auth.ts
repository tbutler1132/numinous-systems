import { cookies } from 'next/headers'

const AUTH_COOKIE_NAME = 'auth_token'

/**
 * Validate a token against the DASHBOARD_TOKEN env var
 */
export function isValidToken(token: string): boolean {
  const expected = process.env.DASHBOARD_TOKEN
  if (!expected) return false
  return token === expected
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
