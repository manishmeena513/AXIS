'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

interface CompassLightingProps {
  tiltX: number
  tiltY: number
}

export default function CompassLighting({ tiltX, tiltY }: CompassLightingProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null)
  const rimLightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (!dirLightRef.current) return
    // Subtle key light shift with tilt — max ±1 unit
    const tx = (tiltY / 90) * 1.2
    const ty = (tiltX / 90) * 0.8
    dirLightRef.current.position.set(-3 + tx, 4 + ty, 4)
  })

  return (
    <>
      {/* Ambient — base fill */}
      <ambientLight intensity={0.18} color="#FFFFFF" />

      {/* Key directional — main illumination */}
      <directionalLight
        ref={dirLightRef}
        intensity={1.4}
        color="#FFF8F0"
        position={[-3, 4, 4]}
        castShadow={false}
      />

      {/* Rim — cool backlight for depth separation */}
      <pointLight
        ref={rimLightRef}
        intensity={0.6}
        color="#B0C8FF"
        position={[3, -2, -3]}
        decay={2}
      />

      {/* Fill — warm underlight to lift shadows */}
      <pointLight
        intensity={0.25}
        color="#FFD090"
        position={[0, -4, 2]}
        decay={2}
      />
    </>
  )
}
