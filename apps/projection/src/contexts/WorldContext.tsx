'use client'

/**
 * WorldContext - State management for 3D world exploration.
 *
 * Manages the free-roam exploration mode where users can walk around
 * and visit surfaces as physical locations.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

/** A surface location in the world */
export interface WorldLocation {
  path: string
  name: string
  category?: 'exhibit' | 'plaza'
}

/** World exploration state */
interface WorldState {
  /** Whether exploration mode is active */
  isExploring: boolean
  /** All surfaces available in the current node */
  surfaces: WorldLocation[]
}

/** Context value exposed to consumers */
interface WorldContextValue extends WorldState {
  /** Enter exploration mode */
  startExploring: (surfaces: WorldLocation[]) => void
  /** Exit exploration mode */
  stopExploring: () => void
}

const WorldContext = createContext<WorldContextValue | null>(null)

export function WorldProvider({ children }: { children: ReactNode }) {
  const [isExploring, setIsExploring] = useState(false)
  const [surfaces, setSurfaces] = useState<WorldLocation[]>([])

  const startExploring = useCallback((availableSurfaces: WorldLocation[]) => {
    setSurfaces(availableSurfaces)
    setIsExploring(true)
  }, [])

  const stopExploring = useCallback(() => {
    setIsExploring(false)
  }, [])

  const value: WorldContextValue = {
    isExploring,
    surfaces,
    startExploring,
    stopExploring,
  }

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
}

export function useWorld() {
  const context = useContext(WorldContext)
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider')
  }
  return context
}
