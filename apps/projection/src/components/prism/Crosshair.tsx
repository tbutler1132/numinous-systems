'use client'

import { useRef, useCallback } from 'react'

interface CrosshairProps {
  visible: boolean
}

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
