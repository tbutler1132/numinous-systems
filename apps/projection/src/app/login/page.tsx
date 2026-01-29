'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        router.push('/')
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid token')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">Login</h1>
        <input
          type="password"
          className="login-input"
          placeholder="Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoFocus
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Authenticating...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
