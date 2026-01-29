'use client'

/**
 * WorldLoader - Lazy loader for 3D world exploration.
 *
 * Defers loading of Three.js until the user actually enters
 * the world. Without this, Three.js would be bundled into
 * the main layout and loaded on every page.
 */

import dynamic from 'next/dynamic'
import { useWorld } from '@/contexts/WorldContext'

const Explore = dynamic(
  () => import('./Explore').then((mod) => ({ default: mod.Explore })),
  { ssr: false }
)

export function WorldLoader() {
  const { isExploring } = useWorld()

  if (!isExploring) {
    return null
  }

  return <Explore />
}
