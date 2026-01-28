/**
 * @file Minimap - Compact navigation trigger showing current location.
 *
 * Always visible in the corner, shows:
 * - Dot visualization of all available locations
 * - Current location name
 * - Animated arrow tracking cursor/scroll position
 *
 * Click to open the full navigation overlay.
 */
'use client'

import type { Ref } from 'react'
import type { Surface } from '@/lib/data'

/** Props for the Minimap component */
interface MinimapProps {
  /** All location surfaces (for dot visualization) */
  locations: Surface[]
  /** The currently active location */
  currentLocation: Surface
  /** Ref to the arrow element (updated by useCursor hook) */
  arrowRef: Ref<HTMLSpanElement>
  /** Whether the navigation overlay is open */
  isOpen: boolean
  /** Called when user clicks to open navigation */
  onOpen: () => void
}

/**
 * Minimap component - compact location indicator and nav trigger.
 *
 * Displays a small map-like visualization with dots for each location
 * and a moving arrow that follows cursor/scroll position.
 */
export function Minimap({ locations, currentLocation, arrowRef, isOpen, onOpen }: MinimapProps) {
  return (
    <>
      <button
        className={`spatial-nav-trigger${isOpen ? ' map-open' : ''}`}
        onClick={onOpen}
        aria-label="Open navigation"
      >
        <span className="minimap">
          {locations.map((surface, i) => {
            const t = locations.length <= 1 ? 0.5 : i / (locations.length - 1)
            return (
              <span
                key={surface.path}
                className="minimap-dot"
                style={{
                  left: `${18 + t * 64}%`,
                  top: `${22 + t * 56}%`,
                }}
              />
            )
          })}
          <span ref={arrowRef} className="minimap-arrow" />
        </span>
        <span className="minimap-location">{currentLocation.name}</span>
      </button>

      <button
        className={`menu-trigger${isOpen ? ' map-open' : ''}`}
        onClick={onOpen}
        aria-label="Open menu"
      >
        Menu
      </button>
    </>
  )
}
