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
import { useAudio } from '@/contexts/AudioContext'
import SensorsClient from '@/app/sensors/SensorsClient'
import ProcessClient from '@/app/process/ProcessClient'
import AudioPlayerClient from '@/app/audio/AudioPlayerClient'

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
/** Static node definitions - isCurrentNode is computed dynamically */
const NODE_DEFINITIONS = [
  { id: 'org', name: 'Org', description: 'The main organization node' },
  { id: 'personal', name: 'Personal', description: 'Your personal space' },
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
  const { registerPrismControls, setPrismOpen } = useAudio()

  // Register Prism controls for audio integration
  useEffect(() => {
    registerPrismControls({
      open: () => setOpen(true),
      setActivePage: (page: string) => setActivePage(page as FacetId),
      setIsOpen: setPrismOpen,
    })
  }, [registerPrismControls, setPrismOpen])

  // Sync Prism open state with AudioContext
  useEffect(() => {
    setPrismOpen(open)
  }, [open, setPrismOpen])

  // Close menu when navigation completes (pathname changes)
  useEffect(() => {
    setNavigating(null)
    setOpen(false)
  }, [pathname])

  // Filter surfaces by kind
  const locations = surfaces.filter(s => !s.external && s.kind === 'location')
  const externalSurfaces = surfaces.filter(s => s.external)
  const allDeviceFeatures = surfaces.filter(s => s.kind === 'device')

  // Filter device features based on access and ifLocked behavior
  const deviceFeatures = allDeviceFeatures.filter(s => {
    const hasAccess = s.requiredAccess === 'anonymous' || isAuthenticated
    if (hasAccess) return true
    return s.ifLocked === 'show'
  })

  // Only locations count as "current" for the minimap - device features are overlays, not places
  const currentLocation = locations.find(
    (s) => s.path === pathname || (s.path !== '/' && pathname.startsWith(s.path))
  ) ?? locations[0]

  const menuPages = buildMenuPages(deviceFeatures)

  // Compute available nodes with dynamic isCurrentNode based on current location
  // Only show personal node when authenticated
  const availableNodes: MapNode[] = NODE_DEFINITIONS
    .filter(node => node.id === 'org' || isAuthenticated)
    .map(node => ({
      ...node,
      isCurrentNode: node.id === currentLocation.nodeId,
    }))

  // Get the current node's display name
  const currentNodeName = NODE_DEFINITIONS.find(n => n.id === currentLocation.nodeId)?.name ?? 'Unknown'

  // Filter locations to only show surfaces from the current node
  const currentNodeLocations = locations.filter(s => s.nodeId === currentLocation.nodeId)

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

              {activePage === '/process/' && (
                <div className="device-panel">
                  <ProcessClient />
                </div>
              )}

              {activePage === '/audio/' && (
                <div className="device-panel">
                  <AudioPlayerClient />
                </div>
              )}

              {activePage === 'map' && (
                <Map
                  view={mapView}
                  nodes={availableNodes}
                  locations={currentNodeLocations}
                  externalSurfaces={externalSurfaces}
                  currentPath={currentLocation.path}
                  currentNodeId={currentLocation.nodeId}
                  currentNodeName={currentNodeName}
                  isAuthenticated={isAuthenticated}
                  onNavigate={setNavigating}
                  onClose={() => setOpen(false)}
                  onToggleView={() => setMapView(v => v === 'local' ? 'world' : 'local')}
                  onSelectNode={(nodeId) => {
                    // Find the first location surface in the selected node
                    const nodeHome = surfaces.find(
                      s => s.nodeId === nodeId && s.kind === 'location' && !s.external
                    )
                    if (nodeHome) {
                      setNavigating(nodeHome.path)
                      window.location.href = nodeHome.path
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
