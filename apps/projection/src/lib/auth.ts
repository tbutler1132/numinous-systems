/**
 * @file Authentication utilities for token-based access control.
 *
 * This module handles authentication for private surfaces (like /dashboard).
 * It uses a simple token-based system where:
 * - A shared secret (DASHBOARD_TOKEN env var) grants access
 * - Tokens are stored in httpOnly cookies for security
 * - Timing-safe comparison prevents timing attacks
 *
 * @see middleware.ts - Uses these utilities for route protection
 * @see /api/auth/* - API routes that use these helpers
 */

import { cookies } from 'next/headers'
import { timingSafeEqual } from 'crypto'

/** Cookie name used to store the authentication token */
export const AUTH_COOKIE_NAME = 'auth_token'

/** Whether we're in development mode */
export const isDev = process.env.NODE_ENV === 'development'

/**
 * Checks if dev mode auth bypass should apply.
 *
 * In development, auth is bypassed unless ?locked param is present.
 * This allows easy local testing while still being able to test
 * the real auth flow by adding ?locked to the URL.
 *
 * @param searchParams - URL search params to check for ?locked
 * @returns True if dev bypass applies (dev mode and no ?locked param)
 */
export function shouldBypassAuth(searchParams: URLSearchParams): boolean {
  return isDev && !searchParams.has('locked')
}

/**
 * Validates a token against the DASHBOARD_TOKEN environment variable.
 *
 * Uses timing-safe comparison to prevent timing attacks where an attacker
 * could infer the correct token by measuring response times.
 *
 * @param token - The token to validate
 * @returns True if the token matches DASHBOARD_TOKEN, false otherwise
 */
export function isValidToken(token: string): boolean {
  const expected = process.env.DASHBOARD_TOKEN
  if (!expected) return false

  // Ensure both strings are the same length for timingSafeEqual
  if (token.length !== expected.length) return false

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

/**
 * Checks if the current request is authenticated (server-side only).
 *
 * Reads the auth cookie from the request and validates it against
 * the expected token. Must be called from a server component or
 * API route handler.
 *
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return false
  return isValidToken(token)
}

/**
 * Returns the cookie options for setting the auth token.
 *
 * Cookie configuration:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: HTTPS only in production
 * - sameSite: 'lax' for CSRF protection while allowing navigation
 * - maxAge: 30 days before expiration
 *
 * @returns Cookie options object compatible with Next.js cookies API
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
