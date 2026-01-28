/**
 * @file useAuth - Client-side authentication state hook.
 *
 * Provides real-time auth status that re-checks on mount to catch
 * login/logout changes from other tabs or sessions.
 */
'use client'

import { useState, useEffect } from 'react'

/**
 * Hook that tracks authentication state on the client.
 *
 * Starts with the server-provided initial state, then re-checks
 * by calling /api/auth/check on mount. This ensures the UI reflects
 * any auth changes that happened since the page was rendered.
 *
 * Supports a ?locked query param for testing unauthenticated UI in dev.
 *
 * @param initialAuthenticated - Server-side auth state (from isAuthenticated())
 * @returns Current authentication status
 */
export function useAuth(initialAuthenticated: boolean = false) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated)

  useEffect(() => {
    // Re-check auth on client to catch any changes (login/logout in other tabs)
    // Pass through ?locked param to simulate unauthenticated state in dev
    const params = new URLSearchParams(window.location.search)
    const authUrl = params.has('locked') ? '/api/auth/check/?locked' : '/api/auth/check/'

    fetch(authUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Auth check failed')
        return res.json()
      })
      .then((data) => {
        setIsAuthenticated(data.authenticated === true)
      })
      .catch((err) => {
        console.error('Auth check error:', err)
        setIsAuthenticated(false)
      })
  }, [])

  return isAuthenticated
}
