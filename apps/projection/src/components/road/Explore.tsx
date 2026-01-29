'use client'

import dynamic from 'next/dynamic'
import { useWorld } from '@/contexts/WorldContext'
import { ExploreUI } from './ExploreUI'

// Dynamic import for ExploreScene to avoid SSR issues with Three.js
const ExploreScene = dynamic(
  () => import('./ExploreScene').then((mod) => ({ default: mod.ExploreScene })),
  { ssr: false }
)

/**
 * Full-screen overlay for free-roam exploration.
 * Renders only when isExploring is true.
 */
export function Explore() {
  const { isExploring } = useWorld()

  if (!isExploring) {
    return null
  }

  return (
    <div className="explore-overlay">
      <ExploreScene />
      <ExploreUI />
    </div>
  )
}
