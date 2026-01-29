/**
 * @file Map - Interactive zoomable/pannable navigation map.
 *
 * Provides two views:
 * - Local: Surfaces within the current node (locations you can navigate to)
 * - World: All available nodes (for future multi-node support)
 *
 * Supports:
 * - Pinch-to-zoom on touch devices
 * - Ctrl/Cmd + scroll wheel zoom on desktop
 * - Drag panning when zoomed in
 * - Click-to-navigate on surfaces
 */
'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { Surface } from '@/lib/data'

/** View mode: 'local' shows surfaces, 'world' shows nodes */
export type MapView = 'local' | 'world'

/** Minimum zoom level (0.5x = zoomed out) */
const MIN_ZOOM = 0.5
/** Maximum zoom level (3x = zoomed in) */
const MAX_ZOOM = 3
/** Zoom sensitivity for scroll wheel (lower = slower zoom) */
const ZOOM_SENSITIVITY = 0.002

/** A node in the world map view */
export interface MapNode {
  /** Unique node identifier */
  id: string
  /** Display name */
  name: string
  /** Optional description text */
  description?: string
  /** Whether this is the user's current node */
  isCurrentNode: boolean
}

/** Props for the Map component */
/** Props for the Map component */
interface MapProps {
  /** Current view mode */
  view: MapView
  /** Available nodes for world view */
  nodes: MapNode[]
  /** Internal location surfaces for local view */
  locations: Surface[]
  /** External link surfaces */
  externalSurfaces: Surface[]
  /** Current page path (for highlighting active surface) */
  currentPath: string
  /** Current node ID */
  currentNodeId: string
  /** Current node display name */
  currentNodeName: string
  /** Whether user is authenticated (affects locked surfaces) */
  isAuthenticated: boolean
  /** Called when user clicks a surface to navigate */
  onNavigate: (path: string) => void
  /** Called when user clicks the current location (to close overlay) */
  onClose: () => void
  /** Called to toggle between local and world view */
  onToggleView: () => void
  /** Called when user selects a node in world view */
  onSelectNode: (nodeId: string) => void
  /** Called when user wants to explore the node in 3D */
  onExplore?: () => void
}

/** Fixed positions for surface markers in local view (scattered layout) */
const POSITIONS = [
  { left: '10%', top: '14%' },
  { left: '26%', top: '36%' },
  { left: '14%', top: '55%' },
  { left: '38%', top: '68%' },
]

/** Fixed positions for node markers in world view */
const NODE_POSITIONS = [
  { left: '35%', top: '40%' },
  { left: '55%', top: '25%' },
  { left: '20%', top: '60%' },
]

/**
 * Interactive map component with zoom, pan, and navigation.
 *
 * Renders either a local view (surfaces within current node) or
 * world view (available nodes). Supports touch gestures for
 * mobile zoom/pan.
 */
export function Map({
  view,
  nodes,
  locations,
  externalSurfaces,
  currentPath,
  currentNodeId,
  currentNodeName,
  isAuthenticated,
  onNavigate,
  onClose,
  onToggleView,
  onSelectNode,
  onExplore,
}: MapProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const lastTouchDistance = useRef<number | null>(null)
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)

  // Keep refs in sync for touch handlers
  useEffect(() => {
    zoomRef.current = zoom
    panRef.current = pan
  }, [zoom, pan])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoom((z) => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * ZOOM_SENSITIVITY))
          if (newZoom <= 1) {
            setPan({ x: 0, y: 0 })
          }
          return newZoom
        })
      }
    }

    const getTouchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const getTouchCenter = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    })

    const isInteractiveElement = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false
      const tag = el.tagName.toLowerCase()
      if (tag === 'a' || tag === 'button') return true
      return el.closest('a, button') !== null
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        lastTouchDistance.current = getTouchDistance(e.touches)
        lastTouchCenter.current = getTouchCenter(e.touches)
      } else if (e.touches.length === 1 && zoomRef.current > 1 && !isInteractiveElement(e.target)) {
        setIsDragging(true)
        dragStart.current = {
          x: e.touches[0].clientX - panRef.current.x,
          y: e.touches[0].clientY - panRef.current.y,
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        e.preventDefault()
        const newDistance = getTouchDistance(e.touches)
        const scale = newDistance / lastTouchDistance.current
        lastTouchDistance.current = newDistance

        setZoom((z) => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * scale))
          if (newZoom <= 1) {
            setPan({ x: 0, y: 0 })
          }
          return newZoom
        })
      } else if (e.touches.length === 1 && zoomRef.current > 1) {
        setPan({
          x: e.touches[0].clientX - dragStart.current.x,
          y: e.touches[0].clientY - dragStart.current.y,
        })
      }
    }

    const handleTouchEnd = () => {
      lastTouchDistance.current = null
      lastTouchCenter.current = null
      setIsDragging(false)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + 0.2))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const newZoom = Math.max(MIN_ZOOM, z - 0.2)
      if (newZoom <= 1) {
        setPan({ x: 0, y: 0 })
      }
      return newZoom
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isInteractive = target.tagName.toLowerCase() === 'a' ||
      target.tagName.toLowerCase() === 'button' ||
      target.closest('a, button') !== null

    if (zoom > 1 && e.button === 0 && !isInteractive) {
      setIsDragging(true)
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }, [zoom, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div
      className={`spatial-nav-map${isDragging ? ' dragging' : ''}${zoom > 1 ? ' zoomed' : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button className="map-node-context" onClick={onToggleView}>
        <span className="map-node-name">
          {view === 'local' ? `${currentNodeName} map` : 'World map'}
        </span>
        <span className="map-view-toggle">{view === 'local' ? '↑' : '↓'}</span>
      </button>

      <div className="map-zoom-controls" onMouseDown={(e) => e.stopPropagation()}>
        <button className="map-zoom-btn" onClick={zoomOut} aria-label="Zoom out">−</button>
        <button className="map-zoom-btn" onClick={zoomIn} aria-label="Zoom in">+</button>
        <div className="map-zoom-bar">
          <div
            className="map-zoom-bar-fill"
            style={{ width: `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%` }}
          />
        </div>
      </div>

      <div className="map-content" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}>
      {view === 'local' && (
        <>
          {locations.map((surface, i) => {
            const isActive = surface.path === currentPath
            const isLocked = surface.requiredAccess !== 'anonymous' && !isAuthenticated
            const pos = POSITIONS[i] ?? { left: `${10 + i * 12}%`, top: `${14 + i * 18}%` }

            return (
              <Link
                key={surface.path}
                href={surface.path}
                className={`spatial-nav-surface${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`}
                style={pos}
                onClick={() => isActive ? onClose() : onNavigate(surface.path)}
              >
                <span
                  className={`spatial-nav-marker${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}${surface.category ? ` category-${surface.category}` : ''}`}
                />
                <span className="spatial-nav-label">{surface.name}</span>
                {isLocked && <span className="spatial-nav-lock">⟠</span>}
              </Link>
            )
          })}
        </>
      )}

      {view === 'world' && (
        <>
          {nodes.map((node, i) => {
            const pos = NODE_POSITIONS[i] ?? { left: `${25 + i * 15}%`, top: `${30 + i * 12}%` }

            return (
              <button
                key={node.id}
                className={`spatial-nav-node${node.isCurrentNode ? ' current' : ''}${node.id === currentNodeId ? ' active' : ''}`}
                style={pos}
                onClick={() => onSelectNode(node.id)}
              >
                <span className="spatial-nav-node-marker" />
                <span className="spatial-nav-node-label">{node.name}</span>
                {node.isCurrentNode && <span className="spatial-nav-node-you">You are here</span>}
              </button>
            )
          })}
        </>
      )}
      </div>

      {view === 'local' && (
        <div className="map-legend">
          <span className="map-legend-item">
            <span className="map-legend-dot category-exhibit" />
            <span className="map-legend-label">Exhibit</span>
          </span>
          <span className="map-legend-item">
            <span className="map-legend-dot category-external" />
            <span className="map-legend-label">External</span>
          </span>
        </div>
      )}

      {/* TODO: Enable when 3D world is ready
      {view === 'local' && onExplore && (
        <button className="map-explore-btn" onClick={onExplore}>
          Enter World
        </button>
      )}
      */}

      {view === 'world' && (
        <div className="map-legend">
          <span className="map-legend-item">
            <span className="map-legend-dot category-node" />
            <span className="map-legend-label">Node</span>
          </span>
        </div>
      )}

      {view === 'local' && externalSurfaces.length > 0 && (
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
  )
}
