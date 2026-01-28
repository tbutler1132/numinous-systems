'use client'

import type { Ref } from 'react'
import type { Surface } from '@/lib/data'

interface MinimapProps {
  locations: Surface[]
  currentLocation: Surface
  arrowRef: Ref<HTMLSpanElement>
  isOpen: boolean
  onOpen: () => void
}

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
