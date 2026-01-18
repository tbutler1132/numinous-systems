import { useState, useEffect } from 'react'
import type { Usage } from '../types'

// Claude Sonnet pricing (per 1M tokens)
const PRICING = {
  input: 3.0, // $3 per 1M input tokens
  output: 15.0, // $15 per 1M output tokens
}

function calculateCost(input_tokens: number, output_tokens: number): number {
  const inputCost = (input_tokens / 1_000_000) * PRICING.input
  const outputCost = (output_tokens / 1_000_000) * PRICING.output
  return inputCost + outputCost
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  return `$${cost.toFixed(2)}`
}

// Global event for usage updates
export const usageEvent = new EventTarget()

export function emitUsage(usage: Usage) {
  usageEvent.dispatchEvent(new CustomEvent('usage', { detail: usage }))
}

export default function DevUsageOverlay() {
  const [isDevMode] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
  )
  const [lastUsage, setLastUsage] = useState<Usage | null>(null)
  const [sessionUsage, setSessionUsage] = useState({ input_tokens: 0, output_tokens: 0 })

  useEffect(() => {
    if (!isDevMode) return

    const handleUsage = (e: Event) => {
      const usage = (e as CustomEvent<Usage>).detail
      setLastUsage(usage)
      setSessionUsage((prev) => ({
        input_tokens: prev.input_tokens + usage.input_tokens,
        output_tokens: prev.output_tokens + usage.output_tokens,
      }))
    }

    usageEvent.addEventListener('usage', handleUsage)
    return () => usageEvent.removeEventListener('usage', handleUsage)
  }, [isDevMode])

  if (!isDevMode) return null

  const totalTokens = sessionUsage.input_tokens + sessionUsage.output_tokens
  const sessionCost = calculateCost(sessionUsage.input_tokens, sessionUsage.output_tokens)

  return (
    <div className="dev-usage-overlay">
      <div className="overlay-title">API Usage (Dev)</div>
      <div className="section-label">Last Request</div>
      <div className="usage-row">
        <span className="usage-label">Input</span>
        <span className="usage-value">
          {lastUsage ? lastUsage.input_tokens.toLocaleString() : '—'}
        </span>
      </div>
      <div className="usage-row">
        <span className="usage-label">Output</span>
        <span className="usage-value">
          {lastUsage ? lastUsage.output_tokens.toLocaleString() : '—'}
        </span>
      </div>
      <div className="usage-row">
        <span className="usage-label">Cost</span>
        <span className="usage-value cost">
          {lastUsage
            ? formatCost(calculateCost(lastUsage.input_tokens, lastUsage.output_tokens))
            : '—'}
        </span>
      </div>
      <div className="section-divider" />
      <div className="section-label">Session Total</div>
      <div className="usage-row">
        <span className="usage-label">Tokens</span>
        <span className="usage-value">{totalTokens.toLocaleString()}</span>
      </div>
      <div className="usage-row">
        <span className="usage-label">Cost</span>
        <span className="usage-value cost">{formatCost(sessionCost)}</span>
      </div>
    </div>
  )
}
