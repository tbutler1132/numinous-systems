'use client'

/**
 * ExploreScene - 3D scene for free-roam exploration mode.
 */

import { Canvas } from '@react-three/fiber'
import { useWorld } from '@/contexts/WorldContext'
import { ExploreEnvironment } from './ExploreEnvironment'
import { ExploreCamera } from './ExploreCamera'

export function ExploreScene() {
  const { surfaces } = useWorld()

  return (
    <Canvas
      style={{ background: '#050510' }}
      gl={{ antialias: true, alpha: false }}
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.6, 0] }}
    >
      <ExploreEnvironment surfaces={surfaces} />
      <ExploreCamera />
    </Canvas>
  )
}
