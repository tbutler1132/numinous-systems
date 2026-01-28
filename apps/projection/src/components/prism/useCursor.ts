/**
 * @file useCursor - Adaptive cursor/scroll position tracking.
 *
 * Provides position tracking that adapts to device capabilities:
 * - Desktop (pointer: fine): Tracks mouse cursor position
 * - Mobile (no pointer): Tracks scroll progress down the page
 *
 * Used by the minimap to show an arrow indicating "where you are".
 */
'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook that tracks cursor or scroll position and updates an element.
 *
 * On desktop, updates the element's position to follow the mouse.
 * On mobile, updates based on scroll progress through the page.
 *
 * @returns Ref to attach to the element that should track position
 */
export function useCursor() {
  const arrowRef = useRef<HTMLSpanElement>(null)

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

  return arrowRef
}
