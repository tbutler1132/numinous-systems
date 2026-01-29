'use client'

/**
 * ExploreCamera - First-person controls for free-roam exploration.
 *
 * Controls:
 * - WASD / Arrow keys: Move
 * - Mouse: Look around (click to lock cursor)
 * - Shift: Move faster
 * - Escape: Exit exploration
 */

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useWorld } from '@/contexts/WorldContext'

/** Movement speed (units per second) */
const MOVE_SPEED = 5
const SPRINT_MULTIPLIER = 2

/** Starting position */
const START_POSITION = new THREE.Vector3(0, 1.6, 0)

export function ExploreCamera() {
  const { stopExploring } = useWorld()
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  // Track which keys are pressed
  const keysPressed = useRef<Set<string>>(new Set())

  // Set initial camera position
  useEffect(() => {
    camera.position.copy(START_POSITION)
  }, [camera])

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code)

      // Escape exits exploration
      if (e.code === 'Escape') {
        stopExploring()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [stopExploring])

  // Movement each frame
  useFrame((_, delta) => {
    const keys = keysPressed.current
    const speed = MOVE_SPEED * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? SPRINT_MULTIPLIER : 1)
    const moveDistance = speed * delta

    // Get camera direction vectors
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0 // Keep movement horizontal
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, camera.up).normalize()

    // Apply movement based on keys
    if (keys.has('KeyW') || keys.has('ArrowUp')) {
      camera.position.addScaledVector(forward, moveDistance)
    }
    if (keys.has('KeyS') || keys.has('ArrowDown')) {
      camera.position.addScaledVector(forward, -moveDistance)
    }
    if (keys.has('KeyA') || keys.has('ArrowLeft')) {
      camera.position.addScaledVector(right, -moveDistance)
    }
    if (keys.has('KeyD') || keys.has('ArrowRight')) {
      camera.position.addScaledVector(right, moveDistance)
    }

    // Keep at fixed height (simple, no jumping for now)
    camera.position.y = START_POSITION.y
  })

  return <PointerLockControls ref={controlsRef} />
}
