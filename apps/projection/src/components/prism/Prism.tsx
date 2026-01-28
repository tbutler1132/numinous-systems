'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { Surface } from '@/lib/data'
import DashboardClient from '@/app/dashboard/DashboardClient'

import { useAuth } from './useAuth'
import { useCursor } from './useCursor'
import { useCrosshair } from './Crosshair'
import { Minimap } from './Minimap'
import { Menu, buildMenuPages, type FacetId } from './Menu'
import { Map, type MapView, type MapNode } from './Map'

interface PrismProps {
  surfaces: Surface[]
  initialAuthenticated?: boolean
}

// Available nodes - for now just Org, but the pattern supports more
const AVAILABLE_NODES: MapNode[] = [
  { id: 'org', name: 'Org', description: 'The main organization node', isCurrentNode: true },
  // Future: user nodes, other orgs, etc.
]

export default function Prism({ surfaces, initialAuthenticated = false }: PrismProps) {
  const [open, setOpen] = useState(false)
  const [activePage, setActivePage] = useState<FacetId>('map')
  const [mapView, setMapView] = useState<MapView>('local')
  const [navigating, setNavigating] = useState<string | null>(null)

  const pathname = usePathname()
  const isAuthenticated = useAuth(initialAuthenticated)
  const arrowRef = useCursor()
  const { CrosshairLines, handleMouseMove, setCrosshairVisible } = useCrosshair()

  // Close menu when navigation completes (pathname changes)
  useEffect(() => {
    setNavigating(null)
    setOpen(false)
  }, [pathname])

  // Filter surfaces by kind
  const locations = surfaces.filter(s => !s.external && s.kind === 'location')
  const externalSurfaces = surfaces.filter(s => s.external)
  const deviceFeatures = surfaces.filter(s => s.kind === 'device')

  // Only locations count as "current" for the minimap - device features are overlays, not places
  const currentLocation = locations.find(
    (s) => s.path === pathname || (s.path !== '/' && pathname.startsWith(s.path))
  ) ?? locations[0]

  const menuPages = buildMenuPages(deviceFeatures)

  const handleOpen = () => {
    setActivePage('map')
    setOpen(true)
  }

  return (
    <>
      <Minimap
        locations={locations}
        currentLocation={currentLocation}
        arrowRef={arrowRef}
        isOpen={open}
        onOpen={handleOpen}
      />

      {open && (
        <div
          className={`spatial-nav-overlay${activePage === 'map' ? ' map-view' : ''}`}
          onClick={() => setOpen(false)}
          onMouseMove={activePage === 'map' ? handleMouseMove : undefined}
        >
          {activePage === 'map' && <CrosshairLines />}

          <div className="game-menu" onClick={(e) => e.stopPropagation()}>
            <Menu
              pages={menuPages}
              activePage={activePage}
              isAuthenticated={isAuthenticated}
              onPageChange={setActivePage}
              onMouseEnter={activePage === 'map' ? () => setCrosshairVisible(false) : undefined}
              onMouseLeave={activePage === 'map' ? () => setCrosshairVisible(true) : undefined}
            />

            <div className="game-menu-content">
              {activePage === '/dashboard/' && (
                <div className="device-panel">
                  <DashboardClient node="private" />
                </div>
              )}

              {activePage === 'map' && (
                <Map
                  view={mapView}
                  nodes={AVAILABLE_NODES}
                  locations={locations}
                  externalSurfaces={externalSurfaces}
                  currentPath={currentLocation.path}
                  currentNodeId={currentLocation.nodeId}
                  currentNodeName="Org"
                  isAuthenticated={isAuthenticated}
                  onNavigate={setNavigating}
                  onToggleView={() => setMapView(v => v === 'local' ? 'world' : 'local')}
                  onSelectNode={(nodeId) => {
                    // For now, just switch back to local view when selecting a node
                    // In the future, this would navigate to that node
                    if (nodeId === 'org') {
                      setMapView('local')
                    }
                  }}
                />
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
