'use client'

/**
 * ExploreUI - Controls overlay for exploration mode.
 */

import { useState, useEffect } from 'react'
import { useWorld } from '@/contexts/WorldContext'

export function ExploreUI() {
  const { stopExploring } = useWorld()
  const [isLocked, setIsLocked] = useState(false)

  // Track pointer lock state
  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(document.pointerLockElement !== null)
    }

    document.addEventListener('pointerlockchange', handleLockChange)
    return () => document.removeEventListener('pointerlockchange', handleLockChange)
  }, [])

  return (
    <div className="explore-ui">
      {!isLocked && (
        <div className="explore-prompt">
          <span className="explore-prompt-text">Click to look around</span>
        </div>
      )}

      <div className="explore-controls-hint">
        <span>WASD to move</span>
        <span className="explore-controls-divider">|</span>
        <span>Shift to run</span>
        <span className="explore-controls-divider">|</span>
        <span>ESC to exit</span>
      </div>

      <button className="explore-exit" onClick={stopExploring}>
        Exit
      </button>
    </div>
  )
}
