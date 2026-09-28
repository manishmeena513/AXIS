'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

interface CompassLightingProps {
  tiltX: number
  tiltY: number
  isLight?: boolean
}

export default function CompassLighting({ tiltX, tiltY, isLight = false }: CompassLightingProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    if (!dirLightRef.current) return
    const tx = (tiltY / 90) * 1.2
    const ty = (tiltX / 90) * 0.8
    dirLightRef.current.position.set(-3 + tx, 4 + ty, 4.2)
  })

  if (isLight) {
    return (
      <>
        {/* Soft warm ivory ambient fill */}
        <ambientLight intensity={0.52} color="#FAF6EE" />

        {/* Neutral studio key light */}
        <directionalLight
          ref={dirLightRef}
          intensity={1.85}
          color="#FFFDF9"
          position={[-3, 4, 4.2]}
        />

        {/* Subtle cool fill light for brushed graphite definition */}
        <directionalLight
          intensity={0.75}
          color="#DCE6F5"
          position={[3.5, -2.5, 3]}
        />

        {/* Restrained warm rim light */}
        <pointLight
          intensity={0.5}
          color="#F5E6C8"
          position={[0, 3.5, 2]}
          decay={2}
        />
      </>
    )
  }

  return (
    <>
      <ambientLight intensity={0.2} color="#FFFFFF" />
      <directionalLight
        ref={dirLightRef}
        intensity={1.45}
        color="#FFF8F0"
        position={[-3, 4, 4.2]}
      />
      <pointLight
        intensity={0.6}
        color="#B0C8FF"
        position={[3, -2, -3]}
        decay={2}
      />
      <pointLight
        intensity={0.28}
        color="#FFD090"
        position={[0, -4, 2]}
        decay={2}
      />
    </>
  )
}
