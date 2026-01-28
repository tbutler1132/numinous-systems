/**
 * @file Crosshair - Mouse tracking visual overlay for map view.
 *
 * Provides a game-like targeting crosshair that follows the cursor
 * in the map view. Adds to the spatial navigation aesthetic.
 */
'use client'

import { useRef, useCallback } from 'react'

/** Props for the Crosshair component */
interface CrosshairProps {
  /** Whether the crosshair is visible */
  visible: boolean
}

/**
 * Static crosshair component (controlled visibility).
 * Use useCrosshair hook for the dynamic version.
 */
export function Crosshair({ visible }: CrosshairProps) {
  const crosshairH = useRef<HTMLDivElement>(null)
  const crosshairV = useRef<HTMLDivElement>(null)

  return (
    <>
      <div
        ref={crosshairH}
        className="spatial-nav-crosshair-h"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        ref={crosshairV}
        className="spatial-nav-crosshair-v"
        style={{ opacity: visible ? 1 : 0 }}
      />
    </>
  )
}

/**
 * Hook for managing a dynamic crosshair that follows mouse movement.
 *
 * Returns:
 * - CrosshairLines: React component rendering the crosshair elements
 * - handleMouseMove: Handler to attach to container's onMouseMove
 * - setCrosshairVisible: Function to show/hide the crosshair
 *
 * @returns Crosshair controls and component
 */
export function useCrosshair() {
  const crosshairH = useRef<HTMLDivElement>(null)
  const crosshairV = useRef<HTMLDivElement>(null)

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

  const CrosshairLines = () => (
    <>
      <div ref={crosshairH} className="spatial-nav-crosshair-h" />
      <div ref={crosshairV} className="spatial-nav-crosshair-v" />
    </>
  )

  return { CrosshairLines, handleMouseMove, setCrosshairVisible }
}
