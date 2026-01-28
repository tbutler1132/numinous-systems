'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { Surface } from '@/lib/data'

type MenuPage = 'map'

interface SpatialNavProps {
  surfaces: Surface[]
  initialAuthenticated?: boolean
}

export default function SpatialNav({ surfaces, initialAuthenticated = false }: SpatialNavProps) {
  const [open, setOpen] = useState(false)
  const [activePage, setActivePage] = useState<MenuPage>('map')
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated)
  const [navigating, setNavigating] = useState<string | null>(null)
  const pathname = usePathname()
  const crosshairH = useRef<HTMLDivElement>(null)
  const crosshairV = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Re-check auth on client to catch any changes (login/logout in other tabs)
    fetch('/api/auth/check/')
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false))
  }, [])

  // Close menu when navigation completes (pathname changes)
  useEffect(() => {
    setNavigating(null)
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const arrow = arrowRef.current
    if (!arrow) return

    // Desktop: track cursor position across viewport
    const onMouseMove = (e: MouseEvent) => {
      arrow.style.left = `${(e.clientX / window.innerWidth) * 100}%`
      arrow.style.top = `${(e.clientY / window.innerHeight) * 100}%`
    }

    // Mobile: track scroll progress down the page
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return
      const yPct = (window.scrollY / scrollHeight) * 100
      arrow.style.top = `${yPct}%`
      arrow.style.left = '50%'
    }

    const hasPointer = window.matchMedia('(pointer: fine)').matches
    if (hasPointer) {
      window.addEventListener('mousemove', onMouseMove)
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

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

  const setCrosshairVisible = useCallback((visible: boolean) => {
    const opacity = visible ? '1' : '0'
    if (crosshairH.current) crosshairH.current.style.opacity = opacity
    if (crosshairV.current) crosshairV.current.style.opacity = opacity
  }, [])

  const localSurfaces = surfaces.filter(s => !s.external)
  const externalSurfaces = surfaces.filter(s => s.external)

  const menuPages: { id: MenuPage; label: string }[] = [
    { id: 'map', label: 'Map' },
  ]

  return (
    <>
      <button
        className={`spatial-nav-trigger${open ? ' map-open' : ''}`}
        onClick={() => { setActivePage('map'); setOpen(true) }}
        aria-label="Open navigation"
      >
        <span className="minimap">
          {localSurfaces.map((surface, i) => {
            const t = localSurfaces.length <= 1 ? 0.5 : i / (localSurfaces.length - 1)
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
        <span className="minimap-location">{current.name}</span>
      </button>

      <button
        className={`menu-trigger${open ? ' map-open' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        Menu
      </button>

      {open && (
        <div
          className="spatial-nav-overlay"
          onClick={() => setOpen(false)}
          onMouseMove={handleMouseMove}
        >
          <div ref={crosshairH} className="spatial-nav-crosshair-h" />
          <div ref={crosshairV} className="spatial-nav-crosshair-v" />

          <div className="game-menu" onClick={(e) => e.stopPropagation()}>
            <nav
              className="game-menu-sidebar"
              onMouseEnter={() => setCrosshairVisible(false)}
              onMouseLeave={() => setCrosshairVisible(true)}
            >
              {menuPages.map((page) => (
                <button
                  key={page.id}
                  className={`game-menu-tab${activePage === page.id ? ' active' : ''}`}
                  onClick={() => setActivePage(page.id)}
                >
                  {page.label}
                </button>
              ))}
            </nav>

            <div className="game-menu-content">
              {activePage === 'map' && (
                <div className="spatial-nav-map">
                  {localSurfaces.map((surface, i) => {
                    const isActive = surface.path === current.path
                    const isLocked = surface.visibility === 'private' && !isAuthenticated
                    const positions = [
                      { left: '10%', top: '14%' },
                      { left: '26%', top: '36%' },
                      { left: '14%', top: '55%' },
                      { left: '38%', top: '68%' },
                    ]
                    const pos = positions[i] ?? { left: `${10 + i * 12}%`, top: `${14 + i * 18}%` }

                    return (
                      <Link
                        key={surface.path}
                        href={surface.path}
                        className={`spatial-nav-surface${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`}
                        style={pos}
                        onClick={() => setNavigating(surface.path)}
                      >
                        <span className={`spatial-nav-marker${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`} />
                        <span className="spatial-nav-label">{surface.name}</span>
                        {isLocked && <span className="spatial-nav-lock">⟠</span>}
                      </Link>
                    )
                  })}

                  {externalSurfaces.length > 0 && (
                    <div className="map-exit-zone">
                      <span className="map-exit-label">External</span>
                      {externalSurfaces.map((surface) => (
                        <a
                          key={surface.path}
                          href={surface.path}
                          className="map-exit-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {surface.name} <span className="spatial-nav-arrow">↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            className="spatial-nav-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            &times;
          </button>

          {navigating && (
            <div className="spatial-nav-loading">
              <span className="spatial-nav-loading-text">Navigating...</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}
