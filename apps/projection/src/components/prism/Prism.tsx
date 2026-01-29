/**
 * @file Prism - The main spatial navigation interface.
 *
 * Prism is the "game-like" overlay that provides navigation between surfaces.
 * It consists of:
 * - Minimap: Always-visible location indicator in the corner
 * - Map: Full-screen zoomable navigation view
 * - Menu: Sidebar with Map tab and device features (e.g., Sensors)
 * - Crosshairs: Visual cursor tracking in map view
 *
 * The prism metaphor: light enters and is split into different surfaces
 * (locations, devices) that you can navigate between.
 */
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { Surface } from '@/lib/data'
import SensorsClient from '@/app/sensors/SensorsClient'

import { useAuth } from './useAuth'
import { useCursor } from './useCursor'
import { useCrosshair } from './Crosshair'
import { Minimap } from './Minimap'
import { Menu, buildMenuPages, type FacetId } from './Menu'
import { Map, type MapView, type MapNode } from './Map'

/** Props for the Prism component */
interface PrismProps {
  /** All available surfaces for navigation */
  surfaces: Surface[]
  /** Initial auth state from server (re-checked on client) */
  initialAuthenticated?: boolean
}

/**
 * Available nodes for the world map view.
 * Currently only shows 'org' node, but the pattern supports multiple nodes
 * for future multi-node navigation.
 */
const AVAILABLE_NODES: MapNode[] = [
  { id: 'org', name: 'Org', description: 'The main organization node', isCurrentNode: true },
]

/**
 * Prism component - the spatial navigation overlay.
 *
 * Renders a minimap trigger in the corner that opens a full-screen
 * navigation interface with map view and device panels.
 *
 * State management:
 * - open: Whether the overlay is visible
 * - activePage: Current menu tab ('map' or a device path)
 * - mapView: 'local' (current node) or 'world' (all nodes)
 * - navigating: Path being navigated to (shows loading state)
 */
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
              {activePage === '/sensors/' && (
                <div className="device-panel">
                  <SensorsClient node="personal" />
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
