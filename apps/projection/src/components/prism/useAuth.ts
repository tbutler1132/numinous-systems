'use client'

import { useState, useEffect } from 'react'

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
