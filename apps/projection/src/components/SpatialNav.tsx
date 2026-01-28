'use client'

import { useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { Surface } from '@/lib/data'

export default function SpatialNav({ surfaces }: { surfaces: Surface[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const crosshairH = useRef<HTMLDivElement>(null)
  const crosshairV = useRef<HTMLDivElement>(null)

  const current = surfaces.find(
    (s) => !s.external && (s.path === pathname || (s.path !== '/' && pathname.startsWith(s.path)))
  ) ?? surfaces[0]

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (crosshairH.current) {
      crosshairH.current.style.top = `${e.clientY}px`
    }
    if (crosshairV.current) {
      crosshairV.current.style.left = `${e.clientX}px`
    }
  }, [])

  const localSurfaces = surfaces.filter(s => !s.external)
  const externalSurfaces = surfaces.filter(s => s.external)

  return (
    <>
      <button
        className="spatial-nav-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        {current.name}
      </button>

      {open && (
        <div
          className="spatial-nav-overlay"
          onClick={() => setOpen(false)}
          onMouseMove={handleMouseMove}
        >
          <div ref={crosshairH} className="spatial-nav-crosshair-h" />
          <div ref={crosshairV} className="spatial-nav-crosshair-v" />
          <button
            className="spatial-nav-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            &times;
          </button>
          <nav className="spatial-nav-map" onClick={(e) => e.stopPropagation()}>
            <div className="spatial-nav-header">Map</div>
            {localSurfaces.map((surface) => {
              const isActive = surface.path === current.path
              const className = `spatial-nav-surface${isActive ? ' active' : ''}`

              return (
                <Link
                  key={surface.path}
                  href={surface.path}
                  className={className}
                  onClick={() => setOpen(false)}
                >
                  <span className={`spatial-nav-marker${isActive ? ' active' : ''}`} />
                  <span className="spatial-nav-label">{surface.name}</span>
                </Link>
              )
            })}
            <div className="spatial-nav-edge">
              {externalSurfaces.map((surface) => (
                <a
                  key={surface.path}
                  href={surface.path}
                  className="spatial-nav-surface external"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <span className="spatial-nav-marker" />
                  <span className="spatial-nav-label">{surface.name}</span>
                  <span className="spatial-nav-arrow">↗</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
